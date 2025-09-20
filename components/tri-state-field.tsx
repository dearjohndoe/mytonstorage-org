import React from "react"

interface TriStateFieldProps {
  states: string[]
  colors: string[]
  value: boolean
  disabled: boolean
  onChange: (value: boolean) => void
}

export function ThreeStateField({ states, colors, value, disabled, onChange }: TriStateFieldProps) {
  if (states.length != 3 || colors.length != 3) {
    throw new Error("Invalid states array");
  }

  const nextValue = !value
  const display = disabled ? states[2] : value ? states[0] : states[1]
  const color = disabled ? colors[2] : value ? colors[0] : colors[1]

  return (
    <div className="items-center gap-2 mt-2">
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
