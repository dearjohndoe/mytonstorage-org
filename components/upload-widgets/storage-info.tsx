"use client"

import { useAppStore } from "@/store/useAppStore";
import { Info } from "lucide-react";

export default function StorageInfo() {
    const { upload, updateWidgetData } = useAppStore();
    const widgetData = upload.widgetData;

    const resetWidgets = () => {
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
            paymentStatus: undefined,
        });
    }

    return (
        <div>
            <div className="p-6 m-4 mb-2">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center">
                        <Info className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg pl-2 font-semibold text-gray-900">Contract deployed</h2>
                    </div>
                </div>

                {/* Storage contract information */}
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2">What's next?</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Your files are now being stored on TON Storage</li>
                            <li>• Providers need some time to download and distribute your files</li>
                            <li>• You can monitor the storage status in the <b>My Storage Bags</b> tab above</li>
                            <li>• You can also view deployed contract on <a href={`https://tonscan.org/address/${widgetData.storageContractAddress}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">TON Scan</a></li>
                        </ul>
                    </div>
                </div>

                <div className="flex justify-between mt-8">
                    <button
                        className="btn ml-auto px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
                        onClick={resetWidgets}
                    >
                        Complete
                    </button>
                </div>
            </div>
        </div>
    );
}
