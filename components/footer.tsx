"use client"

import Link from "next/link"
import { Github, MessageCircle } from "lucide-react"
import { useIsMobile } from "@/hooks/useIsMobile"

export default function Footer() {
  const isMobile = useIsMobile();

  if (isMobile !== null && isMobile) {
    return (
      <footer className="py-8">
        <div className="flex space-x-6 justify-center border-t">
          <div className="flex-none w-[80%] justify-between flex pt-8 items-center">
            <div>
              <Link href="https://t.me/tondev" target="_blank" className="flex my-2 items-center text-gray-500 hover:text-gray-900">
                <MessageCircle className="h-4 w-4 mr-2" />
                Support RU
              </Link>
              <Link href="https://t.me/tondev_eng" target="_blank" className="flex mb-4 items-center text-gray-500 hover:text-gray-900">
                <MessageCircle className="h-4 w-4 mr-2" />
                Support EN
              </Link>
              <Link href="https://github.com/dearjohndoe/mytonstorage-backend" target="_blank" className="flex my-2 items-center text-gray-500 hover:text-gray-900">
                <Github className="h-4 w-4 mr-2" />
                GitHub (backend)
              </Link>
              <Link href="https://github.com/dearjohndoe/mytonstorage-org" target="_blank" className="flex my-2 items-center text-gray-500 hover:text-gray-900">
                <Github className="h-4 w-4 mr-2" />
                GitHub (frontend)
              </Link>
              <Link href="https://github.com/dearjohndoe/mytonstorage-gateway" target="_blank" className="flex my-2 items-center text-gray-500 hover:text-gray-900">
                <Github className="h-4 w-4 mr-2" />
                GitHub (gateway)
              </Link>
            </div>

            <div className="flex space-x-4 mt-4">
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="py-8">
      <div className="flex justify-center border-t">
        <div className="flex-none w-[80%] flex pt-8 items-center justify-center">
          <div className="flex flex-wrap mx-6 gap-x-4 gap-y-2 justify-center text-gray-500">
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4" />
            </div>
            <Link href="https://t.me/tondev" target="_blank" className="flex items-center hover:text-gray-900">
              Support RU
            </Link>
            |
            <Link href="https://t.me/tondev_eng" target="_blank" className="flex items-center hover:text-gray-900">
              Support EN
            </Link>
          </div>
          <div className="flex flex-wrap mx-6 gap-x-4 gap-y-2 justify-center text-gray-500">
            <div className="flex items-center">
              <Github className="flex items-center h-4 w-4" />
            </div>
            <Link href="https://github.com/dearjohndoe/mytonstorage-backend" target="_blank" className="flex items-center hover:text-gray-900">
              Backend
            </Link>
            |
            <Link href="https://github.com/dearjohndoe/mytonstorage-org" target="_blank" className="flex items-center hover:text-gray-900 ">
              Frontend
            </Link>
            |
            <Link href="https://github.com/dearjohndoe/mytonstorage-gateway" target="_blank" className="flex items-center hover:text-gray-900">
              Gateway
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
