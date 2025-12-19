"use client"

import Link from "next/link"
import Image from "next/image"
import { TonConnectButton } from "@tonconnect/ui-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useIsMobile } from "@/hooks/useIsMobile"

export default function Header() {
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    setMounted(true)
  }, [])

  const { t } = useTranslation();

  return (
    <header className="pt-4">
      <div className={`flex m-auto justify-between ${isMobile ? 'w-[95%] px-2' : 'w-[80%]'}`}>
        <Link href="/" className="flex font-medium">
          <span>
            <Image 
              className="rounded-full" 
              src="/logo_48x48.png" 
              alt="Logo" 
              width={isMobile ? 22 : 26} 
              height={isMobile ? 22 : 26} 
            />
          </span>
          <span className={`font-bold ml-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>{t('siteTitle')}</span>
        </Link>
        {mounted && (
          <div className={isMobile ? 'scale-90 origin-right' : ''}>
            <TonConnectButton />
          </div>
        )}
      </div>
    </header>
  )
}
