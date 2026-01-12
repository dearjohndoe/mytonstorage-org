"use client"

import { useTranslation } from "react-i18next"
import { CountdownTimer } from "./countdown-timer"

interface FreeStorageDisplayProps {
  expirationTime: number
  isMobile: boolean | null
}

export function FreeStorageDisplay({ expirationTime, isMobile }: FreeStorageDisplayProps) {
  const { t } = useTranslation()

  return (
    <div className={`${isMobile ? "mb-4" : "flex-1"} mt-4`}>
      <div className={`flex ${isMobile ? 'flex-col' : 'place-content-between'} gap-4`}>
        <label className="text-gray-700">
          {t('newBag.freeStorage')}:
        </label>
        <CountdownTimer expirationTime={expirationTime} />
      </div>
    </div>
  )
}
