"use client"

import Link from 'next/link'
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">{t('errors.notFound')}</h2>
        <p className="text-gray-600 mb-4">{t('errors.resourceNotFound')}</p>
        <Link href="/" className="text-blue-500 hover:text-blue-700">
          {t('returnHome')}
        </Link>
      </div>
    </div>
  )
}
