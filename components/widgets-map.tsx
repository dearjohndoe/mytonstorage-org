"use client"

import { useAppStore } from "@/store/useAppStore"

export default function WidgetsMap() {
  const { upload } = useAppStore()
  const currentWidget = upload.currentWidget

  const steps = [
    { id: 1, label: "Upload Files" },
    { id: 2, label: "Choose Providers" },
    { id: 3, label: "Payment" },
    { id: 4, label: "Complete" }
  ]

  return (
    <div className={`flex flex-col items-center`}>
      <div className="w-full max-w-2xl">
        {/* Background line */}
        <div className="relative mb-4">
          <div className="absolute top-4 left-7 right-5 h-0.5 bg-gray-200" />
          
          {/* Steps container */}
          <div className="flex justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step Dot */}
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200
                    relative z-10 border-4 border-white
                    ${
                      currentWidget === step.id
                        ? "bg-blue-500 text-white"
                        : currentWidget > step.id
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }
                  `}
                >
                  {currentWidget > step.id ? (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                
                {/* Step Label */}
                <div
                  className={`
                    mt-3 text-sm font-medium duration-200 text-center
                    ${
                      currentWidget === step.id
                        ? "text-blue-600"
                        : currentWidget > step.id
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  `}
                >
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
