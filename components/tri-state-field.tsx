import React from "react"

interface TriStateFieldProps {
  states: string[]
  colors: string[]
  value: number // 0, 1, или 2 для трёх состояний
  onChange: (value: number) => void
  disabled?: boolean
}

export function ThreeStateField({ states, colors, value, onChange, disabled = false }: TriStateFieldProps) {
  if (states.length !== 3 || colors.length !== 3) {
    throw new Error("Invalid states array: must contain exactly 3 elements");
  }

  const nextValue = (value + 1) % 3
  const display = states[value]
  const color = disabled ? "bg-gray-300" : colors[value]

  return (
    <div className="flex items-center m-0">
      <button
        type="button"
        className={`px-3 py-1 rounded-full text-sm font-medium ${color} text-gray-700 transition-colors ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:opacity-80'}`}
        onClick={() => !disabled && onChange(nextValue)}
        disabled={disabled}
      >
        {display}
      </button>
    </div>
  )
}
