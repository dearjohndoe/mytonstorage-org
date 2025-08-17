import { ProviderOffer } from "@/types/files"
import { Provider } from "@/types/mytonstorage"

export type ApiResponse = {
  error: string | null
  data: any | null
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
}
