import React from "react"

interface TwoStateFieldProps {
  label: string 
  states: string[]
  colors: string[]
  value: boolean
  onChange: (value: boolean) => void
}

export function TwoStateField({ label, states, colors, value, onChange }: TwoStateFieldProps) {
  if (states.length != 2 || colors.length != 2) {
    throw new Error("Invalid states array");
  }

  const nextValue = !value
  const display = value ? states[0] : states[1]
  const color = value ? colors[0] : colors[1]

  return (
    <div className="flex items-center gap-2 mt-2">
      <label className="text-sm text-gray-700 cursor-pointer">{label}</label>
      <button
        type="button"
        className={`px-3 py-1 rounded-full text-sm font-medium ${color} text-gray-700`}
        onClick={() => onChange(nextValue)}
      >
        {display}
      </button>
    </div>
  )
}
