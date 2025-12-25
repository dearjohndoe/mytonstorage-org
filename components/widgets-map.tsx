"use client"

import { useAppStore } from "@/store/useAppStore"
import { useTranslation } from 'react-i18next'

export default function WidgetsMap() {
  const { upload } = useAppStore()
  const currentWidget = upload.currentWidget
  const { t } = useTranslation()

  const steps = [
    { id: 1, label: t('widgets.uploadFiles') },
    { id: 2, label: t('widgets.details') },
    { id: 3, label: t('widgets.chooseProviders') },
    { id: 4, label: t('widgets.payment') },
    { id: 5, label: t('widgets.complete') }
  ]

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-2xl px-4">
        {/* Steps container */}
        <div className="relative">
          {/* Background line */}
          <div className="absolute top-4 h-0.5 bg-gray-200" 
               style={{ left: 'calc(12.5% + 1rem)', right: 'calc(12.5% + 1rem)' }} />
          
          <div className="flex justify-between items-start">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
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
                    mt-3 text-sm font-medium text-center px-2 leading-tight
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
