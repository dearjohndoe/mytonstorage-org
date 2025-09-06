import React from "react"
import { HelpCircle } from "lucide-react"
import { splitTextSmart } from "@/lib/utils"

interface HintWithQuestionProps {
  text: string
  maxWidth: number
}

export default function HintWithIcon({ text, maxWidth }: HintWithQuestionProps) {
  const lines = splitTextSmart(text, maxWidth)

  return (
    <span className="m-1 relative group inline-flex items-center cursor-pointer">
      <HelpCircle className="h-4 w-4 text-blue-400" />
      <span className="absolute left-4 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg mt-1">
        {lines.map((line, index) => (
          <span key={index}>
            {line}
            {index < lines.length - 1 && <br />}
          </span>
        ))}
      </span>
    </span>
  )
}
