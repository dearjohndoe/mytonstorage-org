import Link from "next/link"
import { Github, MessageCircle } from "lucide-react"

export default function Footer() {
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
  )
}
