"use client"

import React, { useEffect, useState } from "react";
import { NumberField } from "../input-number-field";
import { DateField } from "../input-date-field";
import { ProviderInfo } from "@/lib/types";
import { DEFAULT_INIT_BALANCE, FEE_PROOF, FEE_INIT, MAX_STORAGE_DAYS } from "@/lib/storage-constants";

const getInputDateFromToday = (days: number): string => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + days);

    const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000);
    return local.toISOString().split("T")[0];
};

const normalizeStorageDays = (value: number, proofEveryDays: number): number => {
    if (!Number.isFinite(value)) {
        return proofEveryDays;
    }

    value = Math.min(MAX_STORAGE_DAYS, Math.max(proofEveryDays, Math.floor(value)));
    const remainder = value % proofEveryDays;
    if (remainder !== 0) {
        value += proofEveryDays - remainder;
    }

    const normalized = Math.min(MAX_STORAGE_DAYS, value);
    return normalized;
};

interface StoragePeriodBalanceProps {
    proofPeriodDays: number;
    providers: ProviderInfo[];
    initialStorageDays: number;
    disabled: boolean;
    isMobile: boolean;
    onBalanceChange: (balance: number) => void;
    onStorageDaysChange?: (days: number) => void;
}

export const StoragePeriodBalance: React.FC<StoragePeriodBalanceProps> = ({
    proofPeriodDays,
    providers,
    initialStorageDays,
    disabled: isLoading,
    isMobile,
    onBalanceChange,
    onStorageDaysChange,
}) => {
    const [storageDays, setStorageDays] = useState<number>(initialStorageDays);
    const [storageDate, setStorageDate] = useState<string>(() => getInputDateFromToday(initialStorageDays));
    const [storageDaysVersion, setStorageDaysVersion] = useState(0);
    const [initialBalance, setInitialBalance] = useState<number>(DEFAULT_INIT_BALANCE);
    const [minInitialBalance, setMinInitialBalance] = useState<number>(DEFAULT_INIT_BALANCE);

    useEffect(() => {
        onBalanceChange(initialBalance);
    }, [initialBalance]);

    const calculatePriceBasedOnDaysAndOffers = (selectedDays: number) => {
        const allProvidersPricePerProof = providers.reduce((prev, curr) => {
            let v = curr.offer?.price_per_proof || 0;
            if (v !== 0) {
                v += FEE_PROOF;
            }
            return prev + v;
        }, 0);

        const payments = Math.ceil(selectedDays / proofPeriodDays);
        const totalPrice = Math.max(allProvidersPricePerProof * payments + FEE_INIT, DEFAULT_INIT_BALANCE);
        const minBalance = Math.max(allProvidersPricePerProof + FEE_INIT, DEFAULT_INIT_BALANCE);

        setInitialBalance(totalPrice);
        setMinInitialBalance(minBalance);
    };

    const calculateDaysBasedOnPrice = (newInitBalance: number) => {
        const allProvidersPricePerProof = providers.reduce((prev, curr) => {
            let v = curr.offer?.price_per_proof || 0;
            if (v !== 0) {
                v += FEE_PROOF;
            }
            return prev + v;
        }, 0);

        const pricePerProof = allProvidersPricePerProof + FEE_INIT;
        const coverDays = Math.floor(newInitBalance / pricePerProof) * proofPeriodDays;

        const normalized = normalizeStorageDays(coverDays, proofPeriodDays);
        updateStoragePeriod(normalized);
    };

    const updateStoragePeriod = (normalized: number) => {
        setStorageDate(getInputDateFromToday(normalized));
        setStorageDays((prev) => {
            if (prev === normalized) {
                setStorageDaysVersion((version) => version + 1);
                return prev;
            }

            if (onStorageDaysChange) {
                onStorageDaysChange(normalized);
            }

            return normalized;
        });
    };

    const handleDaysChange = (value: number) => {
        const normalized = normalizeStorageDays(value, proofPeriodDays);
        updateStoragePeriod(normalized);
        calculatePriceBasedOnDaysAndOffers(normalized);
    };

    const handleDateChange = (daysFromToday: number) => {
        const normalized = normalizeStorageDays(daysFromToday, proofPeriodDays);
        updateStoragePeriod(normalized);
        calculatePriceBasedOnDaysAndOffers(normalized);
    };

    const handleBalanceChange = (val: number) => {
        const newInitBalance = Math.ceil(val * 1_000_000_000);
        setInitialBalance(newInitBalance);
        calculateDaysBasedOnPrice(newInitBalance);
    };

    const computeMinDate = () => getInputDateFromToday(proofPeriodDays);

    useEffect(() => {
        const normalized = normalizeStorageDays(storageDays, proofPeriodDays);
        updateStoragePeriod(normalized);
        calculatePriceBasedOnDaysAndOffers(normalized);
    }, [providers]);

    return (
        <>
            {/* Storage period */}
            <div className="m-10">
                <div className="flex justify-center items-end gap-4 mt-4">
                    <NumberField
                        key={storageDaysVersion}
                        label="Set storage period in days"
                        initialValue={storageDays}
                        min={proofPeriodDays}
                        max={MAX_STORAGE_DAYS}
                        isFloating={false}
                        disabled={isLoading}
                        onChange={handleDaysChange}
                    />
                    <DateField
                        key={`storage-date-${storageDaysVersion}`}
                        label="or pick a date"
                        disabled={isLoading}
                        onChange={handleDateChange}
                        minDate={computeMinDate()}
                        value={storageDate}
                    />
                </div>
                <div className={`flex justify-center text-sm text-gray-500 text-center ${isMobile ? 'mt-2' : ''}`}>
                    <span>Storage period must be a multiple of the proof period ({proofPeriodDays} days)</span>
                </div>
            </div>

            {/* Price info */}
            <div className={`${isMobile ? 'm-4' : 'm-10'}`}>
                <div className={`flex justify-center items-end gap-4`}>
                    <NumberField
                        label="or set init balance"
                        initialValue={initialBalance / 1_000_000_000}
                        min={minInitialBalance / 1_000_000_000}
                        max={100}
                        offValidator={true}
                        isFloating={true}
                        disabled={isLoading}
                        onChange={handleBalanceChange}
                    />
                </div>
                <div className={`flex justify-center text-sm text-gray-500 ${isMobile ? 'mt-2' : ''}`}>
                    <span>The absolute minimum is {(minInitialBalance / 1_000_000_000).toFixed(3)} TON</span>
                </div>
            </div>
        </>
    );
};
