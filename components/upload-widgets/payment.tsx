"use client"

import { useAppStore } from "@/store/useAppStore";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { ChevronLeft, ReceiptText } from "lucide-react";
import { useState } from "react";
import { ErrorComponent } from "../error";
import { setBagStorageContract } from "@/lib/api";

export default function Payment() {
    const [tonConnectUI] = useTonConnectUI();
    const { upload, updateWidgetData } = useAppStore();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState<string | null>(null);
    const widgetData = upload.widgetData;

    const sendTransaction = async () => {
        const tx = widgetData.transaction
        if (!tx) {
            console.error("No transaction data available");
            return;
        }

        setLoading(true);

        const message = {
            address: tx.address,
            amount: tx.amount.toString(),
            stateInit: tx.state_init,
            payload: tx.body,
        }
        try {
            if (!widgetData.newBagID) {
                console.error("No new bag ID available");
                setError("Unknown error occurred.");
                setLoading(false);
                return;
            }

            console.log("Sending transaction:", message);
            const resp = await tonConnectUI.sendTransaction({
                validUntil: Math.floor(Date.now() / 1000) + 60,
                messages: [
                    message
                ]
            });

            console.log("Transaction response:", resp);

            if (resp.boc.length > 0) {
                updateWidgetData({
                    storageContractAddress: tx.address,
                });

                setAddress(tx.address);

                sendStorageContract(widgetData.newBagID, tx.address);
            }

        } catch (error) {
            console.error("Error sending transaction:", error);
            setError("Failed to send transaction. Please try again.");
        }

        setLoading(false);
    } 

    const sendStorageContract = async (bagid: string, storageContractAddress: string) => {
        setLoading(true);
        setError(null);

        const response = await setBagStorageContract(bagid, storageContractAddress);
        if (response.error) {
            setError("Try resend address. Got error: " + response.error);
            console.error("Failed to set bag storage contract:", response.error);
        } else if (response.data) {
            console.log("Successfully set bag storage contract");
            updateWidgetData({
                paymentStatus: "success"
            });
        } else {
            setError("Unknown error occurred. Try resend address.");
        }

        setLoading(false);
    };

    const goBack = async () => {
        updateWidgetData({
            providersCount: 0,
            selectedProviders: [],
            transaction: undefined,
        })
    }

    return (
        <div className="p-6 m-4 mb-2">
            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center">
                    <ReceiptText className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg pl-2 font-semibold text-gray-900">Payment</h2>
                </div>
            </div>

            <p className="text-gray-600 my-4">Providers will start uploading files once payment is confirmed.</p>

            <ErrorComponent error={error} />
            <br />

            {loading && <p className="mb-6 text-center">Processing payment...</p>}

            <div className="flex">
                <button
                    className="btn flex items-center border rounded px-4 py-2 hover:bg-gray-100"
                    onClick={goBack}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to providers
                </button>

                {
                    address ? (
                        <button className="btn ml-4 px-4 py-2 rounded bg-blue-500 text-white"
                            onClick={() => {
                                sendStorageContract(widgetData.newBagID!, address)
                            }}
                        >
                            Resend address
                        </button>
                    ) : (
                        <button
                            className="btn ml-4 px-4 py-2 rounded bg-blue-500 text-white"
                            onClick={sendTransaction}
                            disabled={loading}
                        >
                            Send transaction
                        </button>
                    )
                }
            </div>
        </div>
    );
}
