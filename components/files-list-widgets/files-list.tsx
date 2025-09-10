"use client"

import React, { useEffect, useState } from 'react'
import { UploadFile, useAppStore } from '@/store/useAppStore'
import { fetchNewContracts } from '@/lib/ton/transactions';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { getDescriptions, getTopupBalanceTransaction, getWithdrawTransaction } from '@/lib/api';
import { BagInfoShort, Transaction } from '@/lib/types';
import { CircleX, Copy, Info, Wallet, ReceiptText, RefreshCw } from 'lucide-react';
import { copyToClipboard, printSpace, shortenString } from '@/lib/utils';
import { ContractDetails } from '@/components/contract-details';
import { TopupDetails } from '@/components/topup-details';
import { UnpaidFilesList } from './unpaid-list';
import { ErrorComponent } from '@/components/error';
import HintWithIcon from '../hint';
import { getProvidersStorageChecks } from '@/lib/thirdparty';
import { ContractStatus, ContractStatuses } from '@/types/mytonstorage';
import { useIsMobile } from '@/hooks/useIsMobile';
import { StorageContractsMobile } from './storage-contracts-mobile';
import { StorageContractsDesktop } from './storage-contracts-desktop';

export function FilesList() {
  const apiBase = (typeof process !== 'undefined' && process.env.PUBLIC_API_BASE) || "https://mytonstorage.org";
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [error, setError] = useState<string | null>(null);
  const { files, setFiles, setBlockchain } = useAppStore();
  const [localFiles, setLocalFiles] = useState<UploadFile[]>([]);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [selectedTopupContract, setSelectedTopupContract] = useState<string | null>(null);
  const [loadingWithdrawalAddress, setLoadingWithdrawalAddress] = useState<string | null>(null);
  const [loadingTopupAddress, setLoadingTopupAddress] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (wallet?.account.address && !isLoading) {
      // Do not dudos toncenter
      // var ttl = 5 * 60 * 1000; // 5 minutes
      // if (files.list.length > 0) {
      //   const emptyRows = files.list.reduce((prev, curr) => prev + ((curr.info === null || (curr.contractChecks || []).length === 0) ? 1 : 0), 0);
      //   if (files.list.length / 2 > emptyRows) {
      //     ttl = 60 * 1000; // 1 minute
      //   }
      // }
      // if (files.blockchain?.lastUpdate != null && files.blockchain.lastUpdate > Date.now() - ttl) {
      //   return;
      // }

      fetchData();
    }
  }, [wallet?.account.address]);

  useEffect(() => {
    setLocalFiles(files.list);
  }, [files.list]);

  // Handle Esc key to close modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedContract !== null) {
          setSelectedContract(null);
        } else if (selectedTopupContract !== null) {
          setSelectedTopupContract(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedContract, selectedTopupContract]);

  const fetchData = async () => {
    if (isLoading) {
      console.log('fetchData already in progress, skipping');
      return;
    }

    if (!wallet?.account.address) {
      console.info("no account")
      return
    }

    setIsLoading(true);
    setError(null);

    const contracts = await fetchNewContracts(wallet?.account.address);

    if (contracts instanceof Error) {
      setError(contracts.message);
      setIsLoading(false);
      return;
    }

    var newFiles = contracts.map(contract => ({
      contractAddress: contract.address,
      txLt: contract.lt.toString(),
      createdAt: contract.createdAt,
      expiresAt: null,
      info: null,
      contractChecks: [],
      contractInfo: null,
      lastContractUpdate: null,
      status: 'uploaded' as const
    } as UploadFile));

    const maxLt = newFiles.reduce((max, file) => {
      const lt = BigInt(file.txLt);
      return lt > max ? lt : max;
    }, BigInt(0));

    setBlockchain(maxLt.toString(), Date.now());

    const addresses = contracts.map(contract => contract.address).filter(Boolean) as string[];
    if (addresses.length > 0) {
      newFiles = await loadBagsDescriptions(addresses, newFiles);
      newFiles = await loadBagsChecks(addresses, newFiles);

    }

    setFiles(newFiles);
    setIsLoading(false);
  };

  const loadBagsDescriptions = async (addresses: string[], currentFiles: UploadFile[]): Promise<UploadFile[]> => {
    const desc = await getDescriptions(addresses);
    if (desc.status === 401) {
      setError('Unauthorized. Logging out.');
      tonConnectUI.disconnect();
      return [];
    }
    if (desc.error) {
      setError(desc.error);
      return [];
    }

    const data = desc.data as BagInfoShort[];
    const updatedFiles = currentFiles.map(file => {
      const info = data.find(d => d.contract_address === file.contractAddress);
      return {
        ...file,
        info: info || null
      };
    });

    return updatedFiles;
  }

  const loadBagsChecks = async (addresses: string[], currentFiles: UploadFile[]): Promise<UploadFile[]> => {
    const resp = await getProvidersStorageChecks(addresses);
    const checks = resp.data as ContractStatuses;
    if ((resp && resp.error) || !checks || !checks.contracts) {
      console.error("Failed to load providers:", resp.error);
      setError(resp.error);
      return [];
    }

    const updatedFiles = currentFiles.map(file => {
      const contractChecks = checks.contracts.filter(d => d.address === file.contractAddress);
      return {
        ...file,
        contractChecks: contractChecks
      };
    });

    return updatedFiles;
  }

  const topupBalance = async (storageContractAddress: string, amount?: number) => {
    if (!amount) {
      // Открываем модалку для ввода суммы
      setSelectedTopupContract(storageContractAddress);
      return;
    }

    if (loadingWithdrawalAddress || isLoading) {
      return;
    }

    setLoadingTopupAddress(storageContractAddress);
    setError(null);

    const resp = await getTopupBalanceTransaction({ address: storageContractAddress, amount });
    if (resp.status === 401) {
      setError('Unauthorized. Logging out.');
      tonConnectUI.disconnect();
      setLoadingTopupAddress(null);
      return;
    }
    if (resp.error) {
      setLoadingTopupAddress(null);
      setError(resp.error);
      return;
    }

    const tx = resp.data as Transaction;

    const message = {
      address: tx.address,
      amount: tx.amount.toString(),
      stateInit: tx.state_init,
      payload: tx.body,
    };

    setLoadingTopupAddress(null);
    setSelectedTopupContract(null);

    console.log("Sending topup transaction:", message);
    try {
      const wResp = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [message]
      });

      console.log("Topup transaction response:", wResp);
    } catch (error) {
      console.error("Failed to send topup transaction:", error);
      setError("Failed to send transaction");
    }
  }

  const cancelStorage = async (storageContractAddress: string) => {
    if (loadingWithdrawalAddress || isLoading) {
      return;
    }

    setLoadingWithdrawalAddress(storageContractAddress);
    setError(null);
    setIsLoading(false);

    const resp = await getWithdrawTransaction(storageContractAddress);
    if (resp.status === 401) {
      setError('Unauthorized. Logging out.');
      tonConnectUI.disconnect();
      setLoadingWithdrawalAddress(null);
      return;
    }
    if (resp.error) {
      setLoadingWithdrawalAddress(null);
      setError(resp.error);
      return;
    }

    const tx = resp.data as Transaction;

    const message = {
      address: tx.address,
      amount: tx.amount.toString(),
      stateInit: tx.state_init,
      payload: tx.body,
    };

    setLoadingWithdrawalAddress(null);

    console.log("Sending transaction:", message);
    const wResp = await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        message
      ]
    });

    console.log("Transaction response:", wResp);

    if (wResp.boc.length > 0) {
      let filesCopy: UploadFile[] = [];
      localFiles.forEach(f => {
        if (f.contractAddress !== tx.address) {
          filesCopy.push(f);
        }
      });

      setLocalFiles(filesCopy);
    }
  }

  const buildContractChecksBlock = (checks: ContractStatus[]) => {
    var valid = (checks || []).filter(c => c.reason === 0).length;
    var total = (checks || []).length;

    // Определяем цвета на основе статуса
    var validColor, textColor;

    if (total === 0) {
      validColor = 'bg-gray-100';
      textColor = 'text-gray-600';
    } else if (valid === total) {
      validColor = 'bg-green-100 border border-green-200';
      textColor = 'text-green-700';
    } else if (valid > total / 2) {
      validColor = 'bg-yellow-100 border border-yellow-200';
      textColor = 'text-yellow-700';
    } else {
      validColor = 'bg-red-100 border border-red-200';
      textColor = 'text-red-700';
    }

    return (
      <div>
        {total === 0 ? (
          <span className="ml-2 text-xs text-gray-400 italic">No peers</span>
        ) : (
          <div className="flex items-center">
            <div className={`flex rounded-lg ${validColor} w-7 h-6 items-center justify-center text-xs font-semibold ${textColor}`}>
              <span>{valid}</span>
            </div>
            <span className='text-gray-400 mx-1 text-xs font-medium'>/</span>
            <div className='flex rounded-lg bg-gray-100 w-7 h-6 items-center justify-center text-xs font-semibold text-gray-600'>
              <span>{total}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Details modal */}
      {selectedContract !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto pointer-events-none">
          <div className={`relative bg-white border shadow-2xl rounded-xl mt-4 mb-4 mx-auto w-full max-h-[100vh] overflow-y-auto pointer-events-auto ${isMobile ? 'p-4 max-w-none' : 'p-8 max-w-5xl'
            }`}>
            <button
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
              onClick={() => setSelectedContract(null)}
            >
              <span className="text-gray-600 text-lg font-medium">✕</span>
            </button>

            {selectedContract && (
              <div>
                <div className="text-gray-700 mb-2">
                  <div className={`flex items-center ${isMobile ? 'flex-col items-start space-y-2' : ''}`}>
                    <span className="text-gray-900 font-semibold">Storage contract info:</span>
                    <div className={`flex items-center ${isMobile ? '' : 'ml-2'}`}>
                      <a
                        href={`https://tonscan.org/address/${selectedContract}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                        title={selectedContract}>
                        {shortenString(selectedContract, isMobile ? 24 : 48)}
                      </a>
                      <button
                        onClick={() => copyToClipboard(selectedContract, setCopiedKey)}
                        className={`ml-2 transition-colors duration-200
                            ${copiedKey === selectedContract
                            ? "text-gray-100 font-extrabold drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                            : "text-gray-700 hover:text-gray-400"
                          }`}>
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <br />
                  <ContractDetails contractAddress={selectedContract} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Topup modal */}
      {selectedTopupContract !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto pointer-events-none">
          <div className={`relative bg-white border shadow-2xl rounded-xl mt-4 mb-4 mx-auto w-full pointer-events-auto ${isMobile ? 'max-w-none' : 'max-w-lg'
            }`}>
            <button
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
              onClick={() => setSelectedTopupContract(null)}
            >
              <span className="text-gray-600 text-lg font-medium">✕</span>
            </button>

            <TopupDetails
              onConfirm={(amount) => topupBalance(selectedTopupContract, amount)}
              onCancel={() => setSelectedTopupContract(null)}
              isLoading={loadingTopupAddress === selectedTopupContract}
            />
          </div>
        </div>
      )}

      {/* Unpaid - from backend */}
      <div className="relative z-10">
        <UnpaidFilesList />
        <br />
      </div>

      {/* Paid - from blockchain */}
      <div className={`flex items-center justify-between gap-2 mb-4 ${isMobile ? 'px-1' : ''}`}>
        <div className="flex items-center">
          <ReceiptText className={`text-blue-600 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          <h2 className={`pl-2 font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
            Storage contracts
          </h2>
        </div>
      </div>

      {error && <ErrorComponent error={error} />}

      {/* Files list */}
      <div className="grid gap-4">
        {localFiles.length === 0 && (
          <div className={`text-gray-500 text-center py-8 ${isMobile ? 'px-4' : ''}`}>
            <div className="text-gray-300 mb-2">
              <ReceiptText className="w-12 h-12 mx-auto" />
            </div>
            <p className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
              No storage contracts found
            </p>
            <p className={`text-gray-400 ${isMobile ? 'text-xs mt-1' : 'text-sm mt-2'}`}>
              Upload your first file to get started
            </p>
          </div>
        )}

        {localFiles.length > 0 && (
          <>
            {isMobile ? (
              <StorageContractsMobile
                files={localFiles}
                copiedKey={copiedKey}
                setCopiedKey={setCopiedKey}
                onSelectContract={setSelectedContract}
                onTopupBalance={topupBalance}
                onCancelStorage={cancelStorage}
                loadingWithdrawalAddress={loadingWithdrawalAddress}
                isLoading={isLoading}
                buildContractChecksBlock={buildContractChecksBlock}
                apiBase={apiBase}
              />
            ) : (
              <StorageContractsDesktop
                files={localFiles}
                copiedKey={copiedKey}
                setCopiedKey={setCopiedKey}
                onSelectContract={setSelectedContract}
                onTopupBalance={topupBalance}
                onCancelStorage={cancelStorage}
                loadingWithdrawalAddress={loadingWithdrawalAddress}
                isLoading={isLoading}
                buildContractChecksBlock={buildContractChecksBlock}
                apiBase={apiBase}
              />
            )}
          </>
        )}
      </div>
    </div >
  )
}
