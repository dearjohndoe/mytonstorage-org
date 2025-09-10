"use client"

import React from 'react'
import { UploadFile } from '@/store/useAppStore'
import { CircleX, Copy, Info, Wallet, RefreshCw } from 'lucide-react'
import { copyToClipboard, printSpace, shortenString } from '@/lib/utils'
import HintWithIcon from '../hint'

interface StorageContractsDesktopProps {
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

export function StorageContractsDesktop({
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
}: StorageContractsDesktopProps) {
  return (
    <div className="overflow-x-auto">
      <table className="ton-table overscroll-x-auto">
        <thead>
          <tr>
            <th>
              <div className="flex items-center ml-2">
                Contract Address
              </div>
            </th>
            <th>
              <div className="flex items-center">
                Description
              </div>
            </th>
            <th>
              <div className="flex items-center">
                Size
              </div>
            </th>
            <th>
              <div className="flex items-center">
                Peers
                <HintWithIcon text="confirmed file storage / total checked providers (updated hourly by mytonprovider.org)" maxWidth={45} />
              </div>
            </th>
            <th>
              <div className="flex items-center">
                BagID
              </div>
            </th>
            <th>
              <div className="flex items-center">
                Created At
              </div>
            </th>
            <th className="w-8">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((f, index) => (
            <React.Fragment key={`rf-${f.contractAddress}-${Math.random().toString(36).substring(2, 8)}`}>
              <tr className={`group ${index % 2 ? "" : "bg-gray-50"} transition-colors duration-200`}>
                <td>
                  <div className="flex font-mono items-center ml-2">
                    <a
                      href={`https://tonscan.org/address/${f.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      title={f.contractAddress}>
                      {shortenString(f.contractAddress, 10)}
                    </a>
                    <button
                      onClick={() => copyToClipboard(f.contractAddress, setCopiedKey)}
                      className={`ml-2 transition-colors duration-200
                      ${copiedKey === f.contractAddress
                          ? "text-gray-100 font-extrabold drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                          : "text-gray-700 hover:text-gray-400"
                        }`}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </td>
                <td>
                  <div
                    className="flex items-center"
                    title={f.info?.description || ''}>
                    {f.info ? (<span>{shortenString(f.info.description, 35)}</span>) : ("")}
                  </div>
                </td>
                <td>
                  <div className="flex items-center">
                    {f.info ? (<span>{printSpace(f.info.size)}</span>) : ("")}
                  </div>
                </td>
                <td>
                  {buildContractChecksBlock(f.contractChecks || [])}
                </td>
                <td>
                  <div className="flex font-mono items-center">
                    {f.info ? (
                      <div>
                        <a
                          href={`${apiBase}/api/v1/gateway/${f.info.bag_id.toUpperCase()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          title={f.info.bag_id.toUpperCase()}>
                          {shortenString(f.info.bag_id.toUpperCase(), 8)}
                        </a>
                        <button
                          onClick={() => copyToClipboard(f.info!.bag_id.toUpperCase(), setCopiedKey)}
                          className={`ml-2 transition-colors duration-200
                          ${copiedKey === f.info!.bag_id.toUpperCase()
                              ? "text-gray-100 font-extrabold drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                              : "text-gray-700 hover:text-gray-400"
                            }`}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    ) : ("")}
                  </div>
                </td>
                <td>
                  <div className="flex items-center">
                    {new Date(f.createdAt * 1000).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </td>
                <td>
                  <div className="flex items-center">
                    <button
                      onClick={() => onSelectContract(f.contractAddress)}
                      className="p-1 mx-3 rounded-full text-gray-500 hover:text-gray-300"
                      title='Contract details'
                    >
                      <Info className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => onTopupBalance(f.contractAddress)}
                      className="p-1 rounded-full text-gray-800 hover:text-gray-500"
                      title='Topup balance'
                    >
                      <Wallet className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => onCancelStorage(f.contractAddress)}
                      className="p-1 rounded-full"
                      title='Withdraw funds'
                      disabled={loadingWithdrawalAddress !== null || isLoading}
                    >
                      {
                        loadingWithdrawalAddress === f.contractAddress ?
                          <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" /> :
                          <CircleX className="h-5 w-5 text-red-500  hover:text-red-300" />
                      }
                    </button>
                  </div>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
