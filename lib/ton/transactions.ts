import { OutMsg, Transaction } from "@/types/blockchain";
import { Address } from "@ton/ton";
import axios from "axios";

require("buffer");

export type ContractTx = {
    address: string;
    opcode: string;
    createdAt: number;
    txLt: string;
};

export type FetchContractsPageResult = {
    items: ContractTx[];
    nextLt: string;
    reachedEnd: boolean;
    pageMaxLt: string;
    pageMinLt: string;
} | Error;

export async function fetchContractsPage(
    userAddr: string,
    endLt?: string,
    limit: number = 100,
): Promise<FetchContractsPageResult | Error> {
    const txs = await fetchUserTransactions(userAddr, endLt, limit);
    if (txs instanceof Error) return txs;

    const items: ContractTx[] = [];
    let nextLt = endLt ?? "";
    let pageMaxLt = "0";
    let pageMinLt: string | null = null;

    for (const tx of txs) {
        nextLt = tx.prev_trans_lt;
        const txLt = tx.lt;
        if (txLt) {
            if (pageMaxLt === "0" || BigInt(txLt) > BigInt(pageMaxLt)) pageMaxLt = txLt;
            if (pageMinLt === null || BigInt(txLt) < BigInt(pageMinLt)) pageMinLt = txLt;
        }

        if (!tx.out_msgs || tx.out_msgs.length === 0) continue;

        const msg: OutMsg = tx.out_msgs[0];
        if (msg.opcode !== "0x3dc680ae" && msg.opcode !== "0x61fff683") continue;

        const createdAt = Number(msg.created_at);
        items.push({
            address: Address.parseRaw(msg.destination).toString({ testOnly: false }),
            createdAt,
            opcode: msg.opcode,
            txLt: txLt || "0",
        });
    }

    const reachedEnd = nextLt === "0" || txs.length < limit;
    return { items, nextLt, reachedEnd, pageMaxLt, pageMinLt: pageMinLt || "0" };
}

async function fetchUserTransactions(userAddr: string, endLt?: string, limit: number = 100): Promise<Transaction[] | Error> {
    try {
        const params: any = {
            account: userAddr,
            limit,
            sort: "desc",
            archival: true,
        };
        if (endLt) {
            params.end_lt = endLt;
        }

        const response = await axios.get('https://toncenter.com/api/v3/transactions', { params });

        if (response.data && response.data.transactions) {
            return response.data.transactions as Transaction[];
        } else {
            return new Error('Invalid response from TON Center');
        }
    } catch (err) {
        console.error(err);
        return new Error('Failed to fetch transactions');
    }
}

export type SendTxResult = {
    success: boolean;
    source: 'tonconnect' | 'blockchain';
    boc?: string;
    txLt?: string;
    error?: string;
};

export type TxMessage = {
    address: string;
    amount: string;
    stateInit?: string;
    payload?: string;
};

type SendTransactionWithFallbackParams = {
    tonConnectUI: any;
    message: TxMessage;
    contractAddress: string;
    userAddress: string;
    timeoutMs?: number;
    pollingIntervalMs?: number;
};

export async function sendTransactionWithFallback({
    tonConnectUI,
    message,
    contractAddress,
    userAddress,
    timeoutMs = 1000 * 60 * 4,
    pollingIntervalMs = 5000,
}: SendTransactionWithFallbackParams): Promise<SendTxResult> {
    const startTimestamp = Math.floor(Date.now() / 1000);
    let aborted = false;
    let pollingTimeoutId: NodeJS.Timeout | null = null;

    const normalizedContractAddress = normalizeAddress(contractAddress);
    const normalizedUserAddress = normalizeAddress(userAddress);

    const tonConnectPromise = (async (): Promise<SendTxResult> => {
        try {
            const resp = await tonConnectUI.sendTransaction({
                validUntil: Math.floor(Date.now() / 1000) + 300,
                messages: [message],
            });

            if (resp.boc && resp.boc.length > 0) {
                return { success: true, source: 'tonconnect', boc: resp.boc };
            }
            return { success: false, source: 'tonconnect', error: 'Empty BOC response' };
        } catch (err: any) {
            if (aborted) {
                return { success: false, source: 'tonconnect', error: 'Aborted' };
            }
            return { success: false, source: 'tonconnect', error: err?.message || 'Transaction rejected' };
        }
    })();

    const blockchainPollingPromise = (async (): Promise<SendTxResult> => {
        const deadline = Date.now() + timeoutMs;

        while (!aborted && Date.now() < deadline) {
            await sleep(pollingIntervalMs);
            if (aborted) break;

            try {
                const txs = await fetchUserTransactions(userAddress, undefined, 20);
                if (txs instanceof Error) {
                    console.warn('Polling: failed to fetch transactions', txs.message);
                    continue;
                }

                for (const tx of txs) {
                    if (!tx.out_msgs || tx.out_msgs.length === 0) continue;

                    for (const msg of tx.out_msgs) {
                        const msgCreatedAt = Number(msg.created_at);
                        if (msgCreatedAt < startTimestamp) continue;

                        const destination = normalizeAddress(msg.destination);
                        if (destination !== normalizedContractAddress) continue;

                        const source = tx.in_msg?.source 
                            ? normalizeAddress(tx.in_msg.source) 
                            : normalizedUserAddress;
                        if (source !== normalizedUserAddress) continue;

                        return { success: true, source: 'blockchain', txLt: tx.lt };
                    }
                }
            } catch (err) {
                console.warn('Polling: error', err);
            }
        }

        return { success: false, source: 'blockchain', error: 'Polling timeout' };
    })();

    const timeoutPromise = new Promise<SendTxResult>((resolve) => {
        pollingTimeoutId = setTimeout(() => {
            resolve({ success: false, source: 'blockchain', error: 'Global timeout' });
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([
            tonConnectPromise,
            blockchainPollingPromise,
            timeoutPromise,
        ]);

        aborted = true;
        if (pollingTimeoutId) clearTimeout(pollingTimeoutId);

        if (result.success) {
            try {
                await tonConnectUI.closeModal();
            } catch (err) {
                console.warn('Failed to close TonConnect modal', err);
            }
        }

        return result;
    } catch (err: any) {
        aborted = true;
        if (pollingTimeoutId) clearTimeout(pollingTimeoutId);
        return { success: false, source: 'tonconnect', error: err?.message || 'Unknown error' };
    }
}

function normalizeAddress(addr: string): string {
    try {
        return Address.parseRaw(addr).toString({ testOnly: false });
    } catch {
        try {
            return Address.parse(addr).toString({ testOnly: false });
        } catch {
            return addr.toLowerCase();
        }
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
