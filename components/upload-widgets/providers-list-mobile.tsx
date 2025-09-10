"use client"

import React from 'react'
import { ProviderInfo } from '@/lib/types'
import { Copy, Star, X } from 'lucide-react'
import { copyToClipboard, shortenString } from '@/lib/utils'

interface ProvidersListMobileProps {
  providers: ProviderInfo[]
  copiedKey: string | null
  setCopiedKey: (key: string | null) => void
  removeProvider: (pubkey: string) => void
}

export function ProvidersListMobile({
  providers,
  copiedKey,
  setCopiedKey,
  removeProvider
}: ProvidersListMobileProps) {
  return (
    <div className="space-y-3">
      {providers.map((providerInfo, index) => {
        const provider = providerInfo.provider
        const offer = providerInfo.offer
        const decline = providerInfo.decline

        return (
          <div
            key={`mobile-provider-${provider.pubkey}-${index}`}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Provider</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {shortenString(provider.pubkey, 12)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(provider.pubkey, setCopiedKey)}
                    className={`p-1 rounded-md transition-all duration-200 ${
                      copiedKey === provider.pubkey
                        ? "text-green-600 bg-green-50 scale-110"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => removeProvider(provider.pubkey)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Location */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-1">Location</div>
              <p className="text-sm text-gray-700">
                {provider.location ? 
                  `${provider.location.city || '--'}, ${provider.location.country || '--'}` : 
                  '--'
                }
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {/* Rating */}
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Rating</div>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-900">
                    {provider.rating?.toFixed(2) || '--'}
                  </span>
                </div>
              </div>

              {/* Max Span */}
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Max Span</div>
                <span className="text-sm text-gray-700">
                  {provider.max_span ? `${Math.floor(provider.max_span / 86400)}d` : '--'}
                </span>
              </div>

              {/* Price */}
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Price/MB</div>
                <span className="text-sm text-gray-700">
                  {offer?.price_per_mb ? `${(offer.price_per_mb / 1000000000).toFixed(3)} TON` : '--'}
                </span>
              </div>
            </div>

            {/* Status */}
            {decline && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-xs font-medium text-red-700 mb-1">Declined</div>
                <p className="text-xs text-red-600">{decline || 'No reason provided'}</p>
              </div>
            )}

            {offer && !decline && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xs font-medium text-green-700">Offer Confirmed</div>
              </div>
            )}

            {!offer && !decline && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-xs font-medium text-yellow-700">Waiting for response...</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
