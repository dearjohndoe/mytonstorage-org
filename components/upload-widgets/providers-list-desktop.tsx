"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import { ProviderInfo } from '@/lib/types'
import { Copy, Star, X } from 'lucide-react'
import { copyToClipboard, secondsToDays, shortenString } from '@/lib/utils'
import HintWithIcon from '../hint'

interface ProvidersListDesktopProps {
  providers: ProviderInfo[]
  copiedKey: string | null
  advanced: boolean
  setCopiedKey: (key: string | null) => void
  removeProvider: (pubkey: string) => void
}

function normalizeDays(days: number): string {
  if (days < 90) {
    return `${days} d`
  }

  const months = Math.floor(days / 30)
  return `${months} mo`
}

function dateRange(start: number, end: number): string {
  const from = secondsToDays(start)
  const to = secondsToDays(end)

  return `${normalizeDays(from)} - ${normalizeDays(to)}`
}

export function ProvidersListDesktop({
  providers,
  copiedKey,
  advanced,
  setCopiedKey,
  removeProvider
}: ProvidersListDesktopProps) {
  const { t } = useTranslation();
  const hasDeclined = providers.some(p => p.decline)

  return (
    <div className="overflow-x-auto relative">
      <table className="ton-table overscroll-x-auto">
        <thead>
          <tr>
                <th>
              <div className="flex items-center">
                {t('table.publicKey')}
              </div>
            </th>
                <th>
              <div className="flex items-center">
                {t('table.location')}
              </div>
            </th>
                <th>
              <div className="flex items-center">
                {t('table.rating')}
              </div>
            </th>
                <th>
              <div className="flex items-center">
                {t('table.price')}
                <HintWithIcon text={t('status.priceHint')} maxWidth={18} />
              </div>
            </th>
                {
              (advanced) && (
                <th>
                  <div className="flex items-center">{t('table.proofsRange')}</div>
                </th> 
              )
            }
            {
              hasDeclined && (
                <th>
                  <div className="flex items-center">{t('table.reason')}</div>
                </th> 
              )
            }
            {
              advanced && (
                <th>
                  <div className="flex items-center">
                    {t('table.pricePerProof')}
                  </div>
                </th>
              )
            }
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p, index) => (
            <React.Fragment key={p.provider.pubkey}>
              <tr key={p.provider.pubkey} className={`group ${index % 2 ? "" : "bg-gray-50"} transition-colors duration-200`}>
                <td>
                  <div className="flex items-center">
                    <span className="font-mono ">{shortenString(p.provider.pubkey, 15)}</span>
                    <button
                      onClick={() => copyToClipboard(p.provider.pubkey, setCopiedKey)}
                      className={`ml-2 transition-colors duration-200
                        ${copiedKey === p.provider.pubkey
                          ? "text-gray-100 font-extrabold drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                          : "text-gray-700 hover:text-gray-400"
                        }`}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </td>
                <td>
                  {p.provider.location ? (
                    <div className="flex items-center">
                      <span className="">{p.provider.location.country}{p.provider.location.city ? `, ${p.provider.location.city}` : ""}</span>
                    </div>
                  ) : (
                    <span className=" text-gray-500">{t('unknown')}</span>
                  )}
                </td>
                <td>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-transparent group-hover:fill-yellow-400 transition-all duration-200" />
                    <span className="ml-2">{p.provider.rating.toFixed(2)}</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center">
                    {(p.provider.price / 1_000_000_000).toFixed(2)} TON
                  </div>
                </td>
                {
                  advanced && (
                    <td>
                      <div className="flex items-center">
                        {p.offer ? (
                          <span className=''>{secondsToDays(p.offer.offer_span)} days</span>
                        ) : (
                          <span className=' text-gray-500'>{dateRange(p.provider.min_span, p.provider.max_span)}</span>
                        )}
                      </div>
                    </td>
                  )
                }
                {
                  hasDeclined && (
                    <td>
                      <div className="flex items-center">
                                {
                                  p.decline ? (
                                    <span className="text-red-500">{p.decline}</span>
                                  ) : (
                                    <span className="text-green-600">{t('table.accepted')}</span>
                                  )
                                }
                      </div>
                    </td>
                  )
                }
                {
                  advanced && (
                    <td>
                      <div className="flex items-center">
                        {p.offer ? (
                          <span className="">{(p.offer.price_per_proof / 1_000_000_000).toFixed(4)} TON</span>
                        ) : (
                          <span></span>
                        )}
                      </div>
                    </td>
                  )
                }
                <td>
                  <button
                    onClick={() => removeProvider(p.provider.pubkey)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-red-500" />
                  </button>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
