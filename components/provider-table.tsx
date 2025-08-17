"use client"

import { useState } from "react"
import type { Provider } from "@/types/provider"
import {
  Star,
  Copy,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { formatPublicKey, getSortIconType, copyToClipboard } from "@/lib/utils"
import { ProviderDetails } from "./provider-details"

interface ProviderTableProps {
  providers: Provider[]
  loading: boolean
  onSort: (field: string) => void
  sortField: string | null
  sortDirection: "asc" | "desc"
}

export default function ProviderTable({ providers, loading, onSort, sortField, sortDirection }: ProviderTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  if (loading && providers.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (providers.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Providers not found</p>
      </div>
    )
  }

  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const getSortIcon = (field: string) => {
    const iconType = getSortIconType(field, sortField, sortDirection)
    if (!iconType) return null
    return iconType === "up"
      ? <ArrowUp className="h-4 w-4 ml-1 text-blue-500" />
      : <ArrowDown className="h-4 w-4 ml-1 text-blue-500" />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full ton-table">
        <thead>
          <tr>
            <th>
              <div className="flex items-center">
                Public Key
              </div>
            </th>
            <th onClick={() => onSort("uptime")}>
              <div className="flex items-center">
                Uptime
                {getSortIcon("uptime")}
              </div>
            </th>
            <th onClick={() => onSort("workingTime")}>
              <div className="flex items-center">
                Working Time
                {getSortIcon("workingTime")}
              </div>
            </th>
            <th onClick={() => onSort("rating")}>
              <div className="flex items-center">
                Rating
                {getSortIcon("rating")}
              </div>
            </th>
            <th onClick={() => onSort("maxSpan")}>
              <div className="flex items-center">
                Max span
                {getSortIcon("maxSpan")}
              </div>
            </th>
            <th onClick={() => onSort("price")}>
              <div className="flex items-center">
                Price
                {getSortIcon("price")}
              </div>
            </th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <>
              <tr key={provider.id}>
                <td>
                  <div className="flex items-center">
                    <span className="font-mono text-sm">{formatPublicKey(provider.publicKey)}</span>
                    <button
                      onClick={() => copyToClipboard(provider.publicKey, setCopiedKey)}
                      className={`ml-2 transition-colors duration-200
                        ${copiedKey === provider.publicKey
                          ? "text-gray-100 font-extrabold drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                          : "text-gray-700 hover:text-gray-400"
                        }`}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </td>
                <td>{provider.uptime} %</td>
                <td>{provider.workingTime} days</td>
                <td>
                  <div className="flex items-center">
                    <span className="">{provider.providerRating.toFixed(4)}</span>
                    <Star className="h-4 w-4 ml-2 text-yellow-400" />
                  </div>
                </td>
                <td>{provider.maxSpan / 3600} hours</td>
                <td>
                  <div className="flex items-center">{provider.price} 💎</div>
                </td>
                <td>
                  <button
                    onClick={() => toggleRowExpand(provider.id)}
                    className="p-1 rounded-full hover:bg-gray-100"
                    aria-label={expandedRows[provider.id] ? "Collapse details" : "Expand details"}
                  >
                    {expandedRows[provider.id] ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </td>
              </tr>
              
              {expandedRows[provider.id] && (
                <ProviderDetails provider={provider} />
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
