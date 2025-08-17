export interface Provider {
  id: string
  publicKey: string
  uptime: number
  workingTime: number
  price: number
  maxSpan: number
  providerRating: number
  
  // Temp fields that might be used somewhere in code
  available: boolean
  minBounty?: number
  location?: string
  resourceScore?: number
  totalStorage?: number
}
