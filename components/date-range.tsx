import React from "react"
import { Clock, Timer } from "lucide-react"
import { formatSpanTime } from "@/lib/utils"

interface DateRangeProps {
    minRange: number | null
    maxRange: number | null
}

export function DateRange({ minRange, maxRange }: DateRangeProps) {
    const hasValidRange = minRange !== null && maxRange !== null && minRange <= maxRange

    return (
        <div className="p-4 rounded border border-gray-200 shadow-md">
            <div className="flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-700">Storage proofs interval</h3>
            </div>

            {hasValidRange ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-500">Min</span>
                            <span className="text-lg font-semibold text-gray-800">
                                {formatSpanTime(minRange, true)}
                            </span>
                        </div>

                        <div className="text-gray-400">—</div>

                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs text-gray-500">Max</span>
                            <span className="text-lg font-semibold text-gray-800">
                                {formatSpanTime(maxRange, true)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs font-medium text-green-700">Valid providers</span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Can not create storage contract. 
                            Selected providers have incompatible storage proof intervals.</span>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-xs font-medium text-red-700">Invalid providers</span>
                    </div>
                </div>
            )}
        </div>
    )
}
