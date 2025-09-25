import { OutMsg, StorageContracts, Transaction } from "@/types/blockchain";
import { Address } from "@ton/ton";
import axios from "axios";

require("buffer");

export async function fetchContractsPage(
    userAddr: string,
    endLt?: string,
    limit: number = 100,
): Promise<
    | { items: { address: string; createdAt: number; txLt: string }[]; nextLt: string; reachedEnd: boolean; pageMaxLt: string; pageMinLt: string }
    | Error
> {
    const txs = await fetchUserTransactions(userAddr, endLt, limit);
    if (txs instanceof Error) return txs;

    const items: { address: string; createdAt: number; txLt: string }[] = [];
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
        if (msg.opcode !== "0x3dc680ae") continue;

        const createdAt = Number(msg.created_at);
        items.push({
            address: Address.parseRaw(msg.destination).toString({ testOnly: false }),
            createdAt,
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
