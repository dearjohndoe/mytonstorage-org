"use client"

import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  const { resetWidgetData } = useAppStore();

  const goHome = () => {
    resetWidgetData();
    window.location.href = '/';
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">{t('errors.notFound')}</h2>
        <p className="text-gray-600 mb-4">{t('errors.resourceNotFound')}</p>
        <button onClick={goHome} className="text-blue-600 hover:underline cursor-pointer">
          {t('returnHome')}
        </button>
      </div>
    </div>
  )
}
