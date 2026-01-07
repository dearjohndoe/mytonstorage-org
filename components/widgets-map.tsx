"use client"

import { useAppStore } from "@/store/useAppStore"
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function WidgetsMap() {
  const { upload } = useAppStore()
  const currentWidget = upload.currentWidget
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const steps = [
    { id: 1, label: t('widgets.uploadFiles') },
    { id: 2, label: t('widgets.details') },
    { id: 3, label: t('widgets.chooseProviders') },
    { id: 4, label: t('widgets.choosePeriod') },
    { id: 5, label: t('widgets.complete') }
  ]

  if (isMobile) {
    const currentStep = steps.find(step => step.id === currentWidget)
    if (!currentStep) return null

    return (
      <div className="flex flex-col items-center w-full">
        <div className="w-full max-w-sm px-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2 mb-4">
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200
                relative z-10 border-4 border-white
                ${currentWidget === currentStep.id
                    ? "bg-blue-500 text-white"
                    : currentWidget > currentStep.id
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }
              `}
              >
                {currentWidget > currentStep.id ? (
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
                  currentStep.id
                )}
              </div>
              <span className="text-sm text-gray-400">/</span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200
                relative z-10 border-4 border-white bg-gray-400 text-gray-600"
              >
                {steps.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-2xl px-4">
        {/* Steps container */}
        <div className="relative">
          {/* Background line */}
          <div className="absolute top-4 h-0.5 bg-gray-200"
            style={{
              left: `calc(${100 / steps.length / 2}%)`,
              right: `calc(${100 / steps.length / 2}%)`
            }} />

          <div className="flex justify-between items-start">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                {/* Step Dot */}
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200
                    relative z-10 border-4 border-white
                    ${currentWidget === step.id
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
                    ${currentWidget === step.id
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
