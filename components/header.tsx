"use client"

import Link from "next/link"
import Image from "next/image"
import { TonConnectButton } from "@tonconnect/ui-react"
import { useEffect, useState } from "react"

export default function Header() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="pt-4">
      <div className="flex m-auto w-[80%] justify-between">
        <Link href="/" className="flex font-medium">
          <span>
            <Image className="rounded-full" src="/logo_48x48.png" alt="Logo" width={26} height={26} />
          </span>
          <span className="text-xl font-bold ml-2">My TON Storage</span>
        </Link>
        {mounted && <TonConnectButton />}
      </div>
    </header>
  )
}
