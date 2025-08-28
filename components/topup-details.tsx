"use client"

import React, { useState } from "react";
import { Wallet } from "lucide-react";
import { NumberField } from "./input-number-field";

export interface TopupDetailsProps {
    onConfirm: (amount: number) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const defaultTopupAmount = 0.5; // 0.5 TON

export function TopupDetails({ onConfirm, onCancel, isLoading = false }: TopupDetailsProps) {
    const [topupAmount, setTopupAmount] = useState<number>(defaultTopupAmount);

    const handleConfirm = () => {
        const amountInNanoton = Math.ceil(topupAmount * 1_000_000_000);
        onConfirm(amountInNanoton);
    };

    return (
        <div className="p-6 text-black space-y-4">
            <div className="flex items-center font-bold">
                <Wallet className="w-5 h-5 mr-2" />
                Topup Balance
            </div>

            <div className="flex justify-center">
                <NumberField
                    label="Amount (TON)"
                    initialValue={topupAmount}
                    min={0.1}
                    max={100}
                    offValidator={true}
                    onChange={setTopupAmount}
                />
            </div>

            <div className="text-xs text-gray-500 text-center">
                Minimum amount: 0.3 TON
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                    disabled={isLoading || topupAmount < 0.3}
                >
                    {`Topup ${topupAmount} TON`}
                </button>
            </div>
        </div>
    );
}
