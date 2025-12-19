"use client"

import React from 'react'
import { UploadFile } from '@/store/useAppStore'
import { CircleX, Copy, Info, Wallet, RefreshCw } from 'lucide-react'
import { copyToClipboard, printSpace, shortenString } from '@/lib/utils'
import HintWithIcon from '../hint'
import { useTranslation } from "react-i18next";

interface StorageContractsDesktopProps {
  files: UploadFile[]
  copiedKey: string | null
  setCopiedKey: (key: string | null) => void
  onSelectContract: (address: string) => void
  onTopupBalance: (address: string) => void
  onCancelStorage: (address: string) => void
  loadingWithdrawalAddress: string | null
  isLoading: boolean
  hideClosed: boolean
  buildContractChecksBlock: (checks: any[], status: string) => React.ReactNode
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
  hideClosed,
  buildContractChecksBlock,
  apiBase
}: StorageContractsDesktopProps) {
  const { t } = useTranslation();
  if (hideClosed) {
    files = files.filter(f => f.status !== 'closed');
  }

  return (
    <div className="overflow-x-auto">
      <table className="ton-table overscroll-x-auto">
        <thead>
          <tr>
            <th>
              <div className="flex items-center ml-2">
                {t('contractsTable.contractAddress')}
              </div>
            </th>
            <th>
              <div className="flex items-center">
                {t('contractsTable.description')}
              </div>
            </th>
            <th>
              <div className="flex items-center">
                {t('contractsTable.size')}
              </div>
            </th>
            <th>
              <div className="flex items-center">
                {t('contractsTable.status')}
                <HintWithIcon text={t('contractsTable.statusHint')} maxWidth={45} />
              </div>
            </th>
            <th>
              <div className="flex items-center">
                {t('contractsTable.bagId')}
              </div>
            </th>
            <th>
              <div className="flex items-center">
                {t('contractsTable.updatedAt')}
              </div>
            </th>
            <th className="w-8">
              {t('contractsTable.actions')}
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
                  {buildContractChecksBlock(f.contractChecks || [], f.status)}
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
                    {new Date(f.updatedAt * 1000).toLocaleString('ru-RU', {
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
                      title={t('contractsTable.contractDetails')}
                    >
                      <Info className="h-5 w-5" />
                    </button>

                    {
                      f.status !== "closed" && (
                        <div className="flex items-center">
                          <button
                            onClick={() => onTopupBalance(f.contractAddress)}
                            className="p-1 rounded-full text-gray-800 hover:text-gray-500"
                            title={t('contractsTable.topupBalance')}
                          >
                            <Wallet className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => onCancelStorage(f.contractAddress)}
                            className="p-1 rounded-full"
                            title={t('contractsTable.withdrawFunds')}
                            disabled={loadingWithdrawalAddress !== null || isLoading}
                          >
                            {
                              loadingWithdrawalAddress === f.contractAddress ?
                                <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" /> :
                                <CircleX className="h-5 w-5 text-red-500  hover:text-red-300" />
                            }
                          </button>
                        </div>
                      )
                    }

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
