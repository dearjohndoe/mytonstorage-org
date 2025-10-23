"use client"

import React, { useState } from "react"

interface PeriodFieldProps {
    label: string
    suffix?: string
    value: number
    onChange: (value: number) => void
    disabled?: boolean
    isMobile?: boolean
}

const minProofDays = 7
const maxProofDays = 365 * 10
const warnProofDays = 90

const presetPeriods = [
    { value: 7, label: "7" },
    { value: 14, label: "14" },
    { value: 30, label: "30" },
    { value: 90, label: "90" }
]

export function PeriodField({
    label,
    suffix,
    value,
    onChange,
    disabled = false,
    isMobile = false
}: PeriodFieldProps) {
    const [isCustom, setIsCustom] = useState(() => {
        return !presetPeriods.some(preset => preset.value === value)
    })
    const [customInput, setCustomInput] = useState<string>(value.toString())

    const handleSelectChange = (newValue: string) => {
        if (newValue === "custom") {
            setIsCustom(true)
        } else {
            setIsCustom(false)
            const numValue = parseInt(newValue)
            setCustomInput(numValue.toString())
            onChange(numValue)
        }
    }

    const handleCustomInputChange = (inputValue: string) => {
        setCustomInput(inputValue)
        const numValue = parseInt(inputValue)
        if (numValue < minProofDays) {
            return
        }

        if (!isNaN(numValue) && numValue > 0 && numValue <= maxProofDays) {
            onChange(numValue)
        }
    }

    const handleCustomInputBlur = () => {
        const numValue = parseInt(customInput)
        if (isNaN(numValue) || numValue < minProofDays) {
            setCustomInput(minProofDays.toString())
            onChange(minProofDays)
        } else if (numValue > maxProofDays) {
            setCustomInput(maxProofDays.toString())
            onChange(maxProofDays)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
        }
    }

    const randomName = "period-field-" + Math.random().toString(36).substring(2, 15)

    return (
        <div className="mb-4">
            <div className="flex flex-col items-center gap-2">
                <div className={`flex ${isMobile ? 'flex-col' : ''} items-center gap-3`}>
                    <label className="text-gray-700 justify-self-start mr-4" htmlFor={randomName}>
                        {label}:
                    </label>
                    <div className="flex items-center gap-2">
                        <select
                            id={randomName}
                            name={randomName}
                            value={isCustom ? "custom" : value.toString()}
                            onChange={(e) => handleSelectChange(e.target.value)}
                            disabled={disabled}
                            className={
                                `border bg-gray-100 border-gray-100 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200 outline-none transition-colors text-gray-700` +
                                (disabled ? " opacity-50 cursor-not-allowed" : " hover:bg-gray-200 cursor-pointer")
                            }
                        >
                            {presetPeriods.map((preset) => (
                                <option key={preset.value} value={preset.value}>
                                    {preset.label}
                                </option>
                            ))}
                            <option value="custom">Custom...</option>
                        </select>
                        {isCustom && (
                            <input
                                type="number"
                                min={minProofDays}
                                max={maxProofDays}
                                value={customInput}
                                onChange={(e) => handleCustomInputChange(e.target.value)}
                                onBlur={handleCustomInputBlur}
                                onKeyDown={handleKeyDown}
                                placeholder="Days"
                                disabled={disabled}
                                className={
                                    `border bg-gray-100 border-gray-100 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200 outline-none transition-colors w-24 text-center text-gray-700` +
                                    (disabled ? " opacity-50 cursor-not-allowed" : " hover:bg-gray-200")
                                }
                                autoComplete="off"
                            />
                        )}
                    </div>
                    {suffix && <div className="text-gray-600">{suffix}</div>}
                </div>
                <p className={`text-xs text-gray-500 flex items-center gap-1 ${isMobile ? 'text-center' : ''}`}>
                    {
                        value > warnProofDays && (
                            <div className="align-middle flex flex-col items-center gap-1">
                                <span className="flex text-center">⚠️</span>
                                <span className="text-yellow-600 font-medium text-center gap-1">
                                    <pre>Long proof periods reduce blockchain fees but increase risk: providers may stop storing </pre>
                                    <pre>files between infrequent checks. For better data safety, use shorter periods (≤{warnProofDays} days).</pre>
                                </span>
                            </div>
                        )
                    }
                </p>
            </div>
        </div>
    )
}
