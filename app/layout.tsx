import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { TonConnectProvider } from "@/components/ton-connect-provider"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "My TON Storage",
  description: "Window to the TON Storage",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <html lang="ru">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <TonConnectProvider>
            <Header />
            <main className="flex-grow w-full px-2 py-4 sm:py-6">{children}</main>
            <Footer />
          </TonConnectProvider>
        </div>
      </body>
    </html>
  )
}
