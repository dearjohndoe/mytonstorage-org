"use client"

import { ReactNode, useEffect, useState } from "react"
import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react"

interface TonConnectProviderProps {
  children: ReactNode
}

export function TonConnectProvider({ children }: TonConnectProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <TonConnectUIProvider 
      uiPreferences={{ theme: THEME.LIGHT }}
      manifestUrl={(typeof process !== 'undefined' && process.env.PUBLIC_TONCONNECT_MANIFEST_URL) || "https://mytonstorage.org/tonconnect-manifest.json"}
    >
      {children}
    </TonConnectUIProvider>
  )
}
