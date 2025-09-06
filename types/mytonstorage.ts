
export type Providers = {
    providers: Provider[]
}

export type ContractStatuses = {
    contracts: ContractStatus[]
}

export type ContractStatus = {
    address: string
    provider_pubkey: string
    reason: number | null
    reason_timestamp: number | null
}

export type Provider = {
    location: Location
    pubkey: string
    price: number
    rating: number
    address: string
    min_span: number
    max_span: number
    max_bag_size_bytes: number
    status: string
}

export type Location = {
    country: string
    country_iso: string
    city: string
}
