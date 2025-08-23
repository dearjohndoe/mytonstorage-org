export type Contract = {
    address: string;
    lt: bigint;
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
