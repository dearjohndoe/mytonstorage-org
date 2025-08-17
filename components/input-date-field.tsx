import React, { useState, useRef, useEffect } from "react"

interface DateFieldProps {
  label: string
  onChange: (days: number) => void
  minDate?: string
  value?: string
}

const defaultValue = ""

export function DateField({ label, onChange, minDate, value }: DateFieldProps) {
  const [input, setInput] = useState(value || minDate || defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value !== undefined) {
      setInput(value)
    }
  }, [value])

  const handleInputChange = (value: string) => {
    setInput(value)

    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      const today = new Date()
      const timeDiff = date.getTime() - today.getTime()
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24))
      onChange(days)
    } else {
      onChange(0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  const randomName = "date-" + Math.random().toString(36).substring(2, 15)

  const handleDivClick = () => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.showPicker?.()
    }
  }

  return (
    <div className="mb-4">
    <div className="flex flex-wrap items-center">
      <label className="text-gray-700 justify-self-start mr-4" htmlFor={randomName}>{label}:</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          name={randomName}
          id={randomName}
          value={input}
          min={minDate}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={e => handleKeyDown(e)}
          className="sr-only"
          autoComplete="off"
          style={{ direction: "ltr" }}
        />
        <div 
          onClick={handleDivClick}
          className="border bg-gray-100 border-gray-100 rounded px-2 py-2 text-gray-700 min-w-32 text-center cursor-pointer hover:bg-gray-200 transition-colors">
          {input ? (() => {
            const d = new Date(input)
            return !isNaN(d.getTime())
              ? `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`
              : "DD.MM.YYYY"
          })() : "DD.MM.YYYY"}
        </div>
      </div>
    </div>
    </div>
  )
}
