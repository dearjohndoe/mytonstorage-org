"use client"

import React, { useState, useEffect } from "react"

interface NumberFieldProps {
  label: string
  min?: number
  max?: number
  offValidator?: boolean
  isFloating?: boolean
  disabled?: boolean
  onChange: (value: number) => void
  initialValue: number
}

export function NumberField({ label, min, max, offValidator, isFloating, onChange, initialValue, disabled }: NumberFieldProps) {
  const [input, setInput] = useState<string>(initialValue.toString())

  useEffect(() => {
    let value = initialValue

    if (min !== undefined && value < min) {
      value = min
    }
    if (max !== undefined && value > max) {
      value = max
    }

    setInput(isFloating ? value.toFixed(2) : value.toString())
  }, [initialValue, min, max, isFloating])

  const handleInputChange = (value: string) => {
    const pattern = offValidator ? /^-?\d*[.,]?\d*$/ : /^\d*[.,]?\d*$/
    if (pattern.test(value) || value === "" || (offValidator && value === "-")) {
      setInput(value)
    }
  }

  const handleInputFinish = () => {
    // Заменяем запятую на точку для корректного парсинга
    const normalizedInput = input.replace(',', '.')
    const numValue = parseFloat(normalizedInput)

    if (!isNaN(numValue)) {
      let formatted = isFloating ? numValue : Math.floor(numValue)

      if (min !== undefined && formatted < min) {
        formatted = min
      }
      if (max !== undefined && formatted > max) {
        formatted = max
      }

      setInput(isFloating ? formatted.toFixed(2) : formatted.toString())
      onChange(formatted)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleInputFinish()
      e.currentTarget.blur()
    }
  }

  const randomName = "name-" + Math.random().toString(36).substring(2, 15)

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center">
        <label className="text-gray-700 justify-self-start mr-4" htmlFor={randomName}>{label}:</label>
        <input
          type="text"
          inputMode={offValidator ? "decimal" : "numeric"}
          pattern={offValidator ? undefined : "^\d*$"}
          step={offValidator ? "any" : 1}
          name={randomName}
          id={randomName}
          value={input}
          min={min?.toFixed(2)}
          max={max?.toFixed(2)}
          disabled={disabled}
          onChange={e => handleInputChange(e.target.value)}
          onBlur={handleInputFinish}
          onKeyDown={e => handleKeyDown(e)}
          className={
            `border bg-gray-100 border-gray-100 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200 outline-none transition-colors w-24 text-center text-gray-700` +
            (disabled ? " opacity-50 cursor-not-allowed" : " hover:bg-gray-200")
          }
          autoComplete="off"
        />
      </div>
    </div>
  )
}
