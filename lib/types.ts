import { ProviderOffer } from "@/types/files"
import { Provider } from "@/types/mytonstorage"

export type ApiResponse = {
  error: string | null
  status: number | null
  data: any | null
}

export type BagInfoShort = {
  contract_address: string
  bag_id: string
  description: string
  size: number
}

export type ProviderInfo = {
  provider: Provider
  offer: ProviderOffer | null
  decline: string | null
}

export type Transaction = {
  body: string
  state_init: string
  address: string
  amount: number
}

export type ProviderAddress = {
  public_key: string
  address: string
}

export type InitStorageContract = {
  bag_id: string
  providers: string[]
  amount: number
  owner_address: string
  span: number
}

export type UpdateStorageContract = {
  providers: string[]
  bag_size: number
  amount: number
  address: string
  span: number
}

export type TopupBalance = {
  address: string
  amount: number
}
