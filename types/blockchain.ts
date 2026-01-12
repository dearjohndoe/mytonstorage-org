export type StorageContracts = {
    contracts: Contract[];
    endLt: string;
}

export type Contract = {
    address: string;
    createdAt: number;
}

export type ContractInfo = {
    bagID: string;
    fileSize: string;
    chunkSize: number;
    owner: string;
    merkleHash: string;
}

export type ProviderInfo = {
    cid: string;
    ratePerMB: number;
    maxSpan: number;
    lastProof: number;
    nextProofByte: string;
    nonce: string;
}

export type ContractProviders = {
    providers: ProviderInfo[];
    balance: string;
}

export type StorageContractFull = {
    info: ContractInfo;
    providers: ContractProviders;
}

export type OutMsg = {
    opcode?: string;
    created_at: string;
    destination: string;
}

export type InMsg = {
    source?: string;
}

export type Transaction = {
    lt: string;
    prev_trans_lt: string;
    out_msgs: OutMsg[];
    in_msg?: InMsg;
}
