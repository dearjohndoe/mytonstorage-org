
"use client"

import { useAppStore } from "@/store/useAppStore";
import { ProviderInfo, StorageContractFull } from "@/types/blockchain";
import React, { useEffect } from "react";
import { ErrorComponent } from "./error";
import { RenderField } from "./render-field";
import { CircleX, Copy, Info, ListMinus, Loader2, PackageOpen, Pencil, Undo2 } from "lucide-react";
import { copyToClipboard, printSpace, shortenString } from "@/lib/utils";
import { fetchStorageContractFullInfo } from "@/lib/ton/storage-contracts";
import { TextField } from "./input-text-field";
import { getOffers, getUpdateTransaction } from "@/lib/api";
import { Offers } from "@/types/files";
import { Transaction } from "@/lib/types";
import { useTonConnectUI } from "@tonconnect/ui-react";

export interface ContractDetailsProps {
    contractAddress: string;
}

type providerEdit = {
    state: "new" | "deleted" | "same",
    provider: ProviderInfo
}

const contractUpdateTimeout = 1000 * 60 * 60;

export function ContractDetails({ contractAddress }: ContractDetailsProps) {
    const apiBase = (typeof process !== 'undefined' && process.env.PUBLIC_API_BASE) || "https://mytonstorage.org";
    const [tonConnectUI] = useTonConnectUI();
    const { files, setFiles } = useAppStore();
    const [localContractInfo, setLocalContractInfo] = React.useState<StorageContractFull | null>(null);
    const [isLoadingContractInfo, setIsLoadingContractInfo] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
    const [isEdit, setIsEdit] = React.useState(false);
    const [newPubkey, setNewPubkey] = React.useState<string | null>(null);
    const [editProviders, setEditProviders] = React.useState<providerEdit[] | null>(null);

    useEffect(() => {
        let isCached = false;
        files.list.forEach(file => {
            if (file.contractAddress === contractAddress) {
                if (file.lastContractUpdate && Date.now() - file.lastContractUpdate < contractUpdateTimeout) {
                    setLocalContractInfo(file.contractInfo);
                    setEditProviders(file.contractInfo?.providers.providers.map(provider => ({
                        state: "same",
                        provider
                    })) || null);
                    isCached = true;
                }
            }
        });

        if (isCached) return;

        fetchContractInfo();
    }, [contractAddress]);

    useEffect(() => {
        if (files.list.length === 0 || !localContractInfo) return; setLocalContractInfo

        const updatedFiles = files.list.map(file => {
            if (file.contractAddress === contractAddress) {
                return { ...file, contractInfo: localContractInfo, lastContractUpdate: Date.now() };
            }
            return file;
        });

        setFiles(updatedFiles);
    }, [localContractInfo]);

    const fetchContractInfo = async () => {
        if (isLoadingContractInfo) return;

        setIsLoadingContractInfo(true);
        setError(null);

        const info = await fetchStorageContractFullInfo(contractAddress);
        if (info instanceof Error) {
            setIsLoadingContractInfo(false);
            setError(info.message);
            return;
        }

        console.log("Fetched contract info:", info);
        setIsLoadingContractInfo(false);
        setLocalContractInfo(info);
        setEditProviders(info.providers.providers.map(provider => ({
            state: "same",
            provider
        })) || null);
    };

    const addProvider = async (pubkey: string | null) => {
        if (isLoadingContractInfo || !localContractInfo || !pubkey) {
            return;
        }

        const existingProvider = editProviders?.find(provider => provider.provider.cid === pubkey);
        if (existingProvider) {
            setError("Provider already added");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const resp = await getOffers([pubkey], "", Number(localContractInfo!.info.fileSize));
            const offers = resp.data as Offers;
            console.info("Offers", offers);
            if (offers?.declines?.length > 0) {
                setError("Provider declined the offer");
            } else if (offers?.offers?.length > 0) {
                const offer = offers.offers[0];
                setEditProviders(prev => [
                    ...(prev ?? []),
                    {
                        state: "new",
                        provider: {
                            cid: pubkey,
                            ratePerMB: offer?.price_per_mb ?? 0,
                            maxSpan: offer?.offer_span ?? 0,
                            lastProof: 0,
                            nextProofByte: "",
                            nonce: "",
                        },
                    },
                ]);
            } else if (resp && resp.error) {
                console.error("Failed to load providers:", resp.error);
                setError(resp.error);
            } else {
                setError("Unknown error");
            }
        } finally {
            setIsLoading(false);
        }
    }

    const applyProvidersChanges = async () => {
        if (isLoading || !editProviders || editProviders.length === 0) {
            return;
        }applyProvidersChanges

        setIsLoading(true);
        setError(null);

        console.info("Applying providers changes:", editProviders);

        try {
            const resp = await getUpdateTransaction({
                providers: editProviders.filter(p => p.state !== "deleted").map(p => p.provider.cid),
                bag_size: Number(localContractInfo!.info.fileSize),
                amount: 300_000_000,
                address: contractAddress,
            });
            if (resp && resp.error) {
                console.error("Failed to get update transaction:", resp.error);
                setError(resp.error);
            }

            const tx = resp.data as Transaction;

            const message = {
                address: tx.address,
                amount: tx.amount.toString(),
                stateInit: tx.state_init,
                payload: tx.body,
            };

            console.log("Sending update transaction:", message);
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
        } finally {
            setIsLoading(false);
            setIsEdit(false);
        }
    }

    const providersEditableTableBody = () => {
        if (editProviders === null) {
            return <></>;
        }

        return <>
            {editProviders.map((provider, index) => (
                <tr key={provider.provider.cid} className={`${provider.state === "new"
                    ? "bg-green-50"
                    : (provider.state === "deleted"
                        ? "bg-red-50"
                        : (index % 2 ? "" : "bg-gray-50"))}`}>
                    <td>
                        <div className="flex items-center font-medium">
                            <p>
                                {shortenString(provider.provider.cid, 15)}
                            </p>
                            <button
                                onClick={() => copyToClipboard(provider.provider.cid, setCopiedKey)}
                                className={`ml-2 transition-colors duration-200
                                                            ${copiedKey === provider.provider.cid
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
                            {provider.provider.ratePerMB}
                        </div>
                    </td>
                    <td>
                        <div className="flex items-center">
                            {provider.provider.maxSpan}
                        </div>
                    </td>
                    <td>
                        <div className="flex items-center">
                            {provider.provider.lastProof ? new Date(provider.provider.lastProof * 1000).toLocaleString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : ""}
                        </div>
                    </td>
                    <td>
                        <div className="flex items-center">
                            {provider.provider.nextProofByte}
                        </div>
                    </td>
                    <td>
                        <div className="flex items-center">
                            {provider.provider.nonce}
                        </div>
                    </td>
                    <td>
                        <button
                            onClick={() => {
                                console.info(provider)
                                if (provider.state === "new") {
                                    setEditProviders(editProviders.filter(p => p.provider.cid !== provider.provider.cid));
                                    return;
                                }

                                setEditProviders(editProviders.map(p => {
                                    if (p.provider.cid === provider.provider.cid) {
                                        switch (p.state) {
                                            case "deleted":
                                                return { ...p, state: "same" };
                                            default:
                                                return { ...p, state: "deleted" };
                                        }
                                    }

                                    return p;
                                }));
                            }}
                            className="p-1 rounded-full"
                            disabled={false}
                        >
                            {
                                provider.state === "deleted" ?
                                    <Undo2 className="h-5 w-5 text-green-500 hover:text-green-300" />
                                    : <CircleX className="h-5 w-5 text-red-500 hover:text-red-300" />
                            }
                        </button>
                    </td>
                </tr>
            ))
            }
        </>
    }

    const providersReadonlyTableBody = () => {
        if (localContractInfo === null) {
            return <></>;
        }

        return (
            <>
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
                        <td>
                            <button
                                onClick={() => { alert('Withdraw funds'); }}
                                className="p-1 rounded-full"
                                title='Withdraw funds'
                                disabled={true}
                            >
                                <CircleX className="h-5 w-5 text-gray-400" />
                            </button>
                        </td>
                    </tr>
                ))
                }
            </>
        );
    }

    if (isLoadingContractInfo) {
        return (
            <div className="flex justify-center">
                <div className="p-4 text-gray-500">Loading contract information...</div>
            </div>
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
        <div className="p-4 text-black space-y-3 max-h-[calc(90vh-16rem)] overflow-y-auto">
            {
                error && <ErrorComponent error={error} />
            }

            {/* Providers list */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center text-gray-500 font-bold">
                        <ListMinus className="w-4 h-4 mr-2" />Providers
                    </div>
                    <div>
                        {
                            isEdit ? (
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        className="flex items-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md text-sm transition-all duration-200 group"
                                        onClick={() => {
                                            setIsEdit(false);
                                        }}
                                    >
                                        {/* <Cancel className="w-4 h-4 mr-1" /> */}
                                        <span>Cancel</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="flex items-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md text-sm transition-all duration-200 group"
                                        onClick={applyProvidersChanges}
                                    >
                                        {/* <Pencil className="w-4 h-4 mr-1" /> */}
                                        <span>Apply</span>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="flex items-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md text-sm transition-all duration-200 group"
                                    onClick={() => { setIsEdit(true); }}
                                >
                                    <Pencil className="w-4 h-4 mr-1" />
                                    <span>Edit</span>
                                </button>
                            )
                        }
                    </div>
                </div>
                <div>
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
                                        <th>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isEdit ? providersEditableTableBody() : providersReadonlyTableBody()}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex justify-center items-end gap-4 mt-8">
                        <TextField
                            label="Add custom provider"
                            onChange={(value) => { setNewPubkey(value) }}
                            placeholder="Pubkey"
                            disabled={!isEdit}
                        />
                        <button
                            className={`btn text-md flex items-center border rounded px-4 py-2 mb-4 ${isEdit ? 'hover:bg-gray-100' : 'opacity-50 cursor-default'}`}
                            onClick={() => { addProvider(newPubkey) }}
                            disabled={!isEdit}
                        >
                            {
                                isLoading ? <Loader2 className="h-4 w-4 mr-2" /> : <PackageOpen className="h-4 w-4 mr-2" />
                            }

                            Load info
                        </button>
                    </div>
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
                    url={`${apiBase}/api/v1/gateway/${localContractInfo.info.bagID}`}
                    copy={localContractInfo.info.bagID}
                />

                <RenderField
                    label="Balance"
                    value={`${(Number(localContractInfo.providers.balance) / 1_000_000_000).toFixed(4)} TON`}
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

        </div >
    )
}
