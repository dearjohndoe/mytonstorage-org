import React from "react"

interface TriStateFieldProps {
  label: string
  name: string
  states: string[]
  colors: string[]
  value: boolean | null
  onChange: (name: string, value: boolean | null) => void
}

export function ThreeStateField({ label, name, states, colors, value, onChange }: TriStateFieldProps) {
  if (states.length != 3 || colors.length != 3) {
    throw new Error("Invalid states array");
  }

  const nextValue = value === null ? true : value === true ? false : null
  const display = value === null ? states[2] : value ? states[0] : states[1]
  const color = value === null ? colors[2] : value ? colors[0] : colors[1]

  return (
    <div className="flex items-center gap-2 mt-2">
      <label className="text-sm text-gray-700 cursor-pointer">{label}</label>
      <button
        type="button"
        className={`px-3 py-1 rounded-full text-sm font-medium ${color} text-gray-700`}
        onClick={() => onChange(name, nextValue)}
      >
        {display}
      </button>
    </div>
  )
}
