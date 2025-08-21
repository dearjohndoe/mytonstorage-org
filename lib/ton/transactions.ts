import { Contract as StorageContract } from "@/types/blockchain";
import { TonClient, Address, Transaction, Message } from "@ton/ton";

require("buffer");

export async function fetchNewContracts(userAddr: string, lt: string | null, limit: number): Promise<StorageContract[] | Error> {
    let txs: Transaction[] | Error = await fetchUserTransactions(userAddr, lt, limit);
    if (txs instanceof Error) {
        return txs;
    }

    let resp: StorageContract[] = [];

    console.debug(`Found ${txs.length} transactions for user ${userAddr}`);

    for (const tx of txs) {
        if (!tx.outMessages) { continue; }

        if (tx.outMessages.size === 0) { continue; }

        const msg: Message = tx.outMessages.values()[0];
        if (msg.info.type !== "internal") { continue; }

        const originalBody = msg.body.beginParse();
        let body = originalBody.clone();
        if (body.remainingBits < 64) {
            console.warn("Body is too short, skipping transaction:", tx.hash().toString('hex'));
            continue
        }

        let op: number;
        body.skip(32);

        let b = msg.body.beginParse()
        op = b.loadUint(32);
        if (op != 1036419246) {  // 0x3dc680ae
            continue;
        }

        resp.push({
            address: msg.info.dest.toString({ testOnly: false }),
            lt: tx.lt,
            createdAt: msg.info.createdAt
        });
    }

    return resp;
}

async function fetchUserTransactions(userAddr: string, lt: string | null, limit: number): Promise<Transaction[] | Error> {
    let transactions: Transaction[]

    try {
        const client = new TonClient({
            endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        });

        const address = Address.parse(userAddr);
        let opts = {
            limit: limit,
            lt: lt || undefined,
            archival: true,
        }

        transactions = await client.getTransactions(address, opts);
    } catch (err) {
        console.error(err);
        return new Error('Failed to fetch transactions');
    }

    return transactions;
}
