import React, { useEffect, useState } from 'react'
import { UploadFile, useAppStore } from '@/store/useAppStore'
import { UnpaidFilesList } from './unpaid-list'
import { CircleX, Copy, Info, ReceiptText, SquarePen, Wallet } from 'lucide-react'
import { ErrorComponent } from '../error';
import { fetchNewContracts } from '@/lib/ton/transactions';
import { useTonWallet } from '@tonconnect/ui-react';
import { copyToClipboard, printSpace, shortenString } from '@/lib/utils';
import { getDescriptions } from '@/lib/api';
import { BagInfoShort } from '@/lib/types';
import { ContractDetails } from '../contract-details';

const TransactionsCheckLimit = 100;

export function FilesList() {
  const apiBase = (typeof process !== 'undefined' && process.env.PUBLIC_API_BASE) || "https://mytonstorage.org";
  const wallet = useTonWallet();
  const [error, setError] = useState<string | null>(null);
  const { files, setFiles, setBlockchain } = useAppStore();
  const [localFiles, setLocalFiles] = useState<UploadFile[]>([]);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);

  useEffect(() => {
    if (wallet?.account.address && !isLoading) {
      // Do not dudos toncenter
      if (files.blockchain?.lastUpdate != null && files.blockchain.lastUpdate > Date.now() - 5 * 60 * 1000) {
        return;
      }

      fetchData();
    }
  }, [wallet?.account.address]);

  useEffect(() => {
    setLocalFiles(files.list);
  }, [files.list]);

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

    const newFiles = contracts.map(contract => ({
      contractAddress: contract.address,
      txLt: contract.lt.toString(),
      createdAt: contract.createdAt,
      expiresAt: null,
      info: null,
      status: 'uploaded' as const
    } as UploadFile));

    const maxLt = newFiles.reduce((max, file) => {
      const lt = BigInt(file.txLt);
      return lt > max ? lt : max;
    }, BigInt(0));

    setFiles(newFiles);
    setBlockchain(maxLt.toString(), Date.now());

    const addresses = contracts.map(contract => contract.address).filter(Boolean) as string[];
    if (addresses.length > 0) {
      await loadBagDescriptions(addresses, newFiles);
    }

    setIsLoading(false);
  };

  const loadBagDescriptions = async (addresses: string[], currentFiles: UploadFile[]) => {
    const desc = await getDescriptions(addresses);
    if (desc.error) {
      setError(desc.error);
      return;
    }

    const data = desc.data as BagInfoShort[];
    const updatedFiles = currentFiles.map(file => {
      const info = data.find(d => d.contract_address === file.contractAddress);
      return {
        ...file,
        info: info || null
      };
    });

    setFiles(updatedFiles);
  }

  return (
    <div className="space-y-4 relative">
      {/* Details modal */}
      {selectedContract !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
          <div className="relative bg-white border shadow-2xl rounded-xl p-8 mt-4 mb-4 mx-auto max-w-5xl w-full max-h-[100vh] overflow-y-auto pointer-events-auto">
            <button
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
              onClick={() => setSelectedContract(null)}
            >
              <span className="text-gray-600 text-lg font-medium">✕</span>
            </button>

            {selectedContract && (
              <div>
                <div className="text-md text-gray-700 mb-2">
                  <div className="flex items-center">
                    <span className="text-gray-900 font-semibold">Storage contract info:</span>
                    <a
                      href={`https://tonscan.org/address/${selectedContract}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                      title={selectedContract}>
                      {shortenString(selectedContract, 48)}
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
                  <br />
                  <ContractDetails contractAddress={selectedContract} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unpaid - from backend */}
      <div className="relative z-10">
        <UnpaidFilesList />
      </div>

      {/* Paid - from blockchain */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center">
          <ReceiptText className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg pl-2 font-semibold text-gray-900">Storage contracts</h2>
        </div>
      </div>

      {error && <ErrorComponent error={error} />}

      {/* Список файлов */}
      <div className="grid gap-4">
        {localFiles.length === 0 && (
          <div className="text-gray-500 text-center">
            No storage contracts found.
          </div>
        )}

        {/* Local files list */}
        {localFiles && (
          <div className="overflow-x-auto">
            <table className="ton-table overscroll-x-auto">
              <thead>
                <tr>
                  <th>
                    <div className="flex items-center">
                      Description
                    </div>
                  </th>
                  <th>
                    <div className="flex items-center">
                      Contract Address
                    </div>
                  </th>
                  <th>
                    <div className="flex items-center">
                      BagID
                    </div>
                  </th>
                  <th>
                    <div className="flex items-center">
                      Size
                    </div>
                  </th>
                  <th>
                    <div className="flex items-center">
                      Created At
                    </div>
                  </th>
                  <th className="w-10">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {localFiles.map((f, index) => (
                  <React.Fragment key={f.contractAddress}>
                    <tr key={f.contractAddress} className={`group ${index % 2 ? "" : "bg-gray-50"} transition-colors duration-200`}>
                      <td>
                        <div className="flex items-center">
                          {f.info ? (<span>{f.info.description}</span>) : ("--")}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <a
                            href={`https://tonscan.org/address/${f.contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            title={f.contractAddress}>
                            {shortenString(f.contractAddress, 15)}
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
                        <div className="flex items-center">
                          {f.info ? (
                            <div>
                              <a
                                href={`${apiBase}/api/v1/gateway/${f.info.bag_id.toUpperCase()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                                title={f.info.bag_id.toUpperCase()}>
                                {shortenString(f.info.bag_id.toUpperCase(), 15)}
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
                          ) : ("--")}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          {f.info ? (<span>{printSpace(f.info.size)}</span>) : ("--")}
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
                            onClick={() => setSelectedContract(f.contractAddress)}
                            className="p-1 mx-3 rounded-full text-gray-500 hover:text-gray-300"
                            title='Topup balance'
                          >
                            <Info className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => { }}
                            className="p-1 rounded-full text-gray-800 hover:text-gray-500"
                            title='Topup balance'
                          >
                            <Wallet className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => { }}
                            className="p-1 rounded-full text-gray-800 hover:text-gray-500"
                            title='Edit providers list'
                          >
                            <SquarePen className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => { }}
                            className="p-1 rounded-full"
                            title='Withdraw funds'
                          >
                            <CircleX className="h-5 w-5 text-red-500  hover:text-red-300" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div >
  )
}
