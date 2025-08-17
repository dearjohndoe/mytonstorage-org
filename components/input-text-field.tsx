import React, { useState, useEffect } from "react"

interface TextFieldProps {
  label: string
  onChange: (value: string) => void
  placeholder?: string
}

const defaultValue = ""

export function TextField({ label, onChange, placeholder }: TextFieldProps) {
  const [input, setInput] = useState(defaultValue)

  const handleInputChange = (value: string) => {
    setInput(value)
    onChange(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
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
          name={randomName}
          id={randomName}
          value={input}
          placeholder={placeholder}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={e => handleKeyDown(e)}
          className={
            "border bg-gray-100 border-gray-100 rounded px-2 py-2 focus:ring-2 focus:ring-blue-200 outline-none transition-colors min-w-64 text-gray-700"
          }
          autoComplete="off"
        />
      </div>
    </div>
  )
}
