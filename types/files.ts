
export type FileMetadata = {
    description: string;
};

export type UserBag = {
    bag_id: string;
    user_address: string;
    created_at: number;
    description: string;
    files_count: number;
    bag_size: number;
}

export type AddedBag = {
    bag_id: string;
};

export type UnpaidBags = {
    free_storage: number;
    bags: UserBag[];
}

export type Offers = {
    offers: ProviderOffer[];
    declines: ProviderDecline[];
};

export type ProviderOffer = {
    offer_span: number;
    price_per_day: number;
    price_per_proof: number;
    price_per_mb: number;
    provider: ProviderContractData;
};

export type ProviderContractData = {
    key: string;
    min_bounty: string;
    min_span: number;
    max_span: number;
    rate_per_mb_day: number;
};

export type ProviderDecline = {
    provider_key: string;
    reason: string;
};

export type FileInfo = {
    name: string;
    size: number;
    path: string | null;
};
