
import { useAppStore } from "@/store/useAppStore";
import { StorageContractFull } from "@/types/blockchain";
import React, { useEffect } from "react";
import { ErrorComponent } from "./error";
import { RenderField } from "./render-field";
import { Copy, Info, ListMinus } from "lucide-react";
import { copyToClipboard, printSpace, shortenString } from "@/lib/utils";
import { fetchStorageContractFullInfo } from "@/lib/ton/storage-contracts";

export interface ContractDetailsProps {
    contractAddress: string;
}

const contractUpdateTimeout = 1000 * 60 * 15;

export function ContractDetails({ contractAddress }: ContractDetailsProps) {
    const apiBase = (typeof process !== 'undefined' && process.env.PUBLIC_API_BASE) || "https://mytonstorage.org";
    const { files, setFiles } = useAppStore();
    const [localContractInfo, setLocalContractInfo] = React.useState<StorageContractFull | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

    useEffect(() => {
        let isCached = false;
        files.list.forEach(file => {
            if (file.contractAddress === contractAddress) {
                if (file.lastContractUpdate && Date.now() - file.lastContractUpdate < contractUpdateTimeout) {
                    setLocalContractInfo(file.contractInfo);
                    isCached = true;
                }
            }
        });

        if (isCached) return;

        fetchContractInfo();
    }, [contractAddress]);

    useEffect(() => {
        if (files.list.length === 0 || !localContractInfo) return;

        const updatedFiles = files.list.map(file => {
            if (file.contractAddress === contractAddress) {
                return { ...file, contractInfo: localContractInfo, lastContractUpdate: Date.now()};
            }
            return file;
        });

        setFiles(updatedFiles);
    }, [localContractInfo]);

    const fetchContractInfo = async () => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);

        const info = await fetchStorageContractFullInfo(contractAddress);
        if (info instanceof Error) {
            setIsLoading(false);
            setError(info.message);
            return;
        }

        console.log("Fetched contract info:", info);
        setIsLoading(false);
        setLocalContractInfo(info);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center">
                <div className="p-4 text-gray-500">Loading contract information...</div>
            </div>
        );
    }

    if (error) {
        return (
            <ErrorComponent error={error} />
        );
    }

    if (!localContractInfo) {
        return (
            <div className="p-4">
                <span>Contract information is not available</span>
            </div>
        );
    }

    return (
        <div className="p-4 text-black space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
            {/* Providers list */}
            <div>
                <div className="flex items-center mb-2 text-gray-500 font-bold">
                    <ListMinus className="w-4 h-4 mr-2" />Providers
                </div>
                <div className="max-h-60 overflow-y-auto">
                    {localContractInfo.providers.providers.length === 0 ? (
                        <div className="text-gray-500 text-center py-4">
                            No providers found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="ton-table [&_th:hover]:cursor-default [&_tr:hover]:cursor-default">
                                <thead>
                                    <tr>
                                        <th>
                                            <div className="flex items-center">
                                                Public Key
                                            </div>
                                        </th>
                                        <th>
                                            <div className="flex items-center">
                                                Rate per MB
                                            </div>
                                        </th>
                                        <th>
                                            <div className="flex items-center">
                                                Max Span
                                            </div>
                                        </th>
                                        <th>
                                            <div className="flex items-center">
                                                Last Proof
                                            </div>
                                        </th>
                                        <th>
                                            <div className="flex items-center">
                                                Next Proof Byte
                                            </div>
                                        </th>
                                        <th>
                                            <div className="flex items-center">
                                                Nonce
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {localContractInfo.providers.providers.map((provider, index) => (
                                        <tr key={provider.cid} className={`${index % 2 ? "" : "bg-gray-50"}`}>
                                            <td>
                                                <div className="flex items-center font-medium">
                                                    <p>
                                                        {shortenString(provider.cid, 15)}
                                                    </p>
                                                    <button
                                                        onClick={() => copyToClipboard(provider.cid, setCopiedKey)}
                                                        className={`ml-2 transition-colors duration-200
                                                            ${copiedKey === provider.cid
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
                                                    {provider.ratePerMB}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center">
                                                    {provider.maxSpan}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center">
                                                    {new Date(provider.lastProof * 1000).toLocaleString('ru-RU', {
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
                                                    {provider.nextProofByte}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center">
                                                    {provider.nonce}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <br />
            {/* Storage info */}
            <div>
                <div className="flex items-center mb-2 text-gray-500 font-bold">
                    <Info className="w-4 h-4 mr-2" />Storage
                </div>
                <RenderField
                    label="Bag ID"
                    value={localContractInfo.info.bagID}
                    url={`${apiBase}/api/v1/${localContractInfo.info.bagID}`}
                    copy={localContractInfo.info.bagID}
                />

                <RenderField
                    label="File size"
                    value={printSpace(Number(localContractInfo.info.fileSize))}
                />

                <RenderField
                    label="Chunk size"
                    value={printSpace(localContractInfo.info.chunkSize)}
                />

                <RenderField
                    label="Owner"
                    value={localContractInfo.info.owner}
                    url={`https://tonscan.org/address/${localContractInfo.info.owner}`}
                    copy={localContractInfo.info.owner}
                />

                <RenderField
                    label="Merkle Hash"
                    value={localContractInfo.info.merkleHash}
                    copy={localContractInfo.info.merkleHash}
                />
            </div>

        </div>
    )
}
