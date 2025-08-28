"use client"

import { getUnpaid, removeFile } from "@/lib/api";
import { UserBag } from "@/types/files";
import { Ban, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ErrorComponent } from "../error";
import React from "react";
import { useAppStore } from "@/store/useAppStore";

export function UnpaidFilesList() {
    const { updateWidgetData } = useAppStore()
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [unpaidFiles, setUnpaidFiles] = useState<UserBag[] | null>(null);
    const [storageTime, setStorageTime] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);


    const fetchData = async () => {
        if (isLoading) return;

        setIsLoading(true);

        const resp = await getUnpaid();
        if (resp.error) {
            setError(resp.error);
        } else {
            setUnpaidFiles(resp.data.bags || []);
            setStorageTime(resp.data.free_storage || null);
        }

        setIsLoading(false);
    };

    const cancelStorage = async (bagid: string) => {
        if (isLoading) return;

        setIsLoading(true);

        try {
            const success = await removeFile(bagid);
            if (success) {
                console.log("Unpaid file removed successfully");

                updateWidgetData({
                    selectedFiles: [],
                    newBagID: undefined,
                    newBagInfo: undefined,
                    bagInfo: undefined,
                    description: undefined,

                    providersCount: 0,
                    selectedProviders: [],
                    transaction: undefined,

                    storageContractAddress: undefined,
                    paymentStatus: undefined
                });
                fetchData();
            } else {
                console.error("Failed to remove unpaid file");
            }
        } catch (error) {
            console.error("Failed to remove unpaid file:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!error && (!unpaidFiles || unpaidFiles.length === 0)) {
        return <div></div>
    }

    return (
        <div>
            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center">
                    <Ban className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg pl-2 font-semibold text-gray-900">Unpaid files</h2>
                </div>
            </div>

            {error && <ErrorComponent error={error} />}

            {
                !isLoading && unpaidFiles && unpaidFiles.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="ton-table overscroll-x-auto">
                            <thead>
                                <tr>
                                    <th>
                                        <div className="flex items-center">
                                            BagID
                                        </div>
                                    </th>
                                    <th>
                                        <div className="flex items-center">
                                            Uploaded at
                                        </div>
                                    </th>
                                    <th>
                                        <div className="flex items-center">
                                            Free store until
                                        </div>
                                    </th>
                                    <th>
                                        <div className="flex items-center">
                                            Actions
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {unpaidFiles.map((f, index) => (
                                    <React.Fragment key={f.bag_id}>
                                        <tr key={f.bag_id} className={`group ${index % 2 ? "" : "bg-gray-50"} transition-colors duration-200`}>
                                            <td>
                                                <div className="flex items-center">
                                                    {f.bag_id}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center">
                                                    {f.created_at}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center">
                                                    {storageTime}
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => {
                                                        cancelStorage(f.bag_id);
                                                    }}
                                                    className="flex p-1 rounded-full hover:bg-gray-100"
                                                >
                                                    <X className="h-5 w-5 text-red-500" />
                                                    {/* <Banknote className="ml-2 h-5 w-5 text-blue-500" /> */}
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
        </div>
    )
}
