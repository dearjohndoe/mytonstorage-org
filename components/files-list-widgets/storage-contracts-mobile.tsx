"use client"

import React from 'react'
import { UploadFile } from '@/store/useAppStore'
import { CircleX, Copy, Info, Wallet, RefreshCw } from 'lucide-react'
import { copyToClipboard, printSpace, shortenString } from '@/lib/utils'

interface StorageContractsMobileProps {
    files: UploadFile[]
    copiedKey: string | null
    setCopiedKey: (key: string | null) => void
    onSelectContract: (address: string) => void
    onTopupBalance: (address: string) => void
    onCancelStorage: (address: string) => void
    loadingWithdrawalAddress: string | null
    isLoading: boolean
    buildContractChecksBlock: (checks: any[]) => React.ReactNode
    apiBase: string
}

export function StorageContractsMobile({
    files,
    copiedKey,
    setCopiedKey,
    onSelectContract,
    onTopupBalance,
    onCancelStorage,
    loadingWithdrawalAddress,
    isLoading,
    buildContractChecksBlock,
    apiBase
}: StorageContractsMobileProps) {
    return (
        <div className="space-y-3">
            {files.map((f, index) => (
                <div
                    key={`mobile-${f.contractAddress}-${Math.random().toString(36).substring(2, 8)}`}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
                >
                    {/* Header: Contract Address and Metadata */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-500 mb-1">Contract</div>
                            <div className="flex items-center space-x-2">
                                <a
                                    href={`https://tonscan.org/address/${f.contractAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                    title={f.contractAddress}
                                >
                                    {shortenString(f.contractAddress, 14)}
                                </a>
                                <button
                                    onClick={() => copyToClipboard(f.contractAddress, setCopiedKey)}
                                    className={`p-1 rounded-md transition-all duration-200 ${copiedKey === f.contractAddress
                                        ? "text-green-600 bg-green-50 scale-110"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="text-right ml-3">
                            <div className="text-sm font-semibold text-gray-900 mb-0.5">
                                {f.info?.size ? (
                                    printSpace(f.info.size)
                                ) : (
                                    <span className="text-gray-400 italic">--</span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">
                                {new Date(f.createdAt * 1000).toLocaleDateString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <div className="text-xs font-medium text-gray-500 mb-1">Description</div>
                        <p className="text-gray-700 line-clamp-2" title={f.info?.description || ''}>
                            {
                                f.info ? (
                                    shortenString(f.info.description, 40)
                                ) : (
                                    <span className="text-gray-400 italic">--</span>
                                )
                            }
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* BagID */}
                        <div>
                            <div className="font-medium text-xs text-gray-500 mb-2">Bag ID</div>
                            {f.info?.bag_id ? (
                                <div className="flex items-center space-x-1">
                                    <a
                                        href={`${apiBase}/api/v1/gateway/${f.info.bag_id.toUpperCase()}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-blue-600 hover:text-blue-800 transition-colors"
                                        title={f.info.bag_id.toUpperCase()}
                                    >
                                        {shortenString(f.info.bag_id.toUpperCase(), 16)}
                                    </a>
                                    <button
                                        onClick={() => copyToClipboard(f.info!.bag_id.toUpperCase(), setCopiedKey)}
                                        className={`p-0.5 rounded transition-all duration-200 ${copiedKey === f.info!.bag_id.toUpperCase()
                                            ? "text-green-600 bg-green-50"
                                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-400 italic">--</span>
                            )}
                        </div>

                        {/* Providers checks */}
                        <div className='justify-self-end'>
                            <div className="text-right text-xs font-medium text-gray-500 mb-2">Providers checks</div>
                            {buildContractChecksBlock(f.contractChecks || [])}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                        <button
                            onClick={() => onSelectContract(f.contractAddress)}
                            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                            title="Contract details"
                        >
                            <Info className="h-4 w-4" />
                        </button>

                        <button
                            onClick={() => onTopupBalance(f.contractAddress)}
                            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                            title="Topup balance"
                        >
                            <Wallet className="h-4 w-4" />
                        </button>

                        <button
                            onClick={() => onCancelStorage(f.contractAddress)}
                            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-red-50 transition-all duration-200"
                            title="Withdraw funds"
                            disabled={loadingWithdrawalAddress !== null || isLoading}
                        >
                            {loadingWithdrawalAddress === f.contractAddress ? (
                                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                            ) : (
                                <CircleX className="h-4 w-4 text-red-500 hover:text-red-600" />
                            )}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
