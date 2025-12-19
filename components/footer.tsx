"use client"

import Link from "next/link"
import { Github, Globe, MessageCircle } from "lucide-react"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useTranslation } from "react-i18next"

export default function Footer() {
  const isMobile = useIsMobile();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ru" : "en";
    i18n.changeLanguage(newLang);
  };

  if (isMobile !== null && isMobile) {
    return (
      <footer className="py-8">
        <div className="flex space-x-6 justify-center border-t">
          <div className="flex-none w-[80%] justify-between flex pt-8 items-center">
            <div>
              <button onClick={toggleLanguage} className="flex items-center text-gray-500 hover:text-gray-900">
                <Globe className="h-4 w-4 mr-2" />
                {i18n.language === "en" ? "RU" : "EN"}
              </button>

              <Link href="https://t.me/tondev" target="_blank" className="flex my-2 items-center text-gray-500 hover:text-gray-900">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('footer.supportChatRU')}
              </Link>
              <Link href="https://t.me/tondev_eng" target="_blank" className="flex mb-4 items-center text-gray-500 hover:text-gray-900">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('footer.supportChatEN')}
              </Link>
              <Link href="https://github.com/dearjohndoe/mytonstorage-backend" target="_blank" className="flex my-2 items-center text-gray-500 hover:text-gray-900">
                <Github className="h-4 w-4 mr-2" />
                {t('footer.githubBackend')}
              </Link>
              <Link href="https://github.com/dearjohndoe/mytonstorage-org" target="_blank" className="flex my-2 items-center text-gray-500 hover:text-gray-900">
                <Github className="h-4 w-4 mr-2" />
                {t('footer.githubFrontend')}
              </Link>
              <Link href="https://github.com/dearjohndoe/mytonstorage-gateway" target="_blank" className="flex my-2 items-center text-gray-500 hover:text-gray-900">
                <Github className="h-4 w-4 mr-2" />
                {t('footer.gateway')}
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
          <div className="mx-6 justify-center text-gray-500">
            <button onClick={toggleLanguage} className="flex items-center text-gray-500 hover:text-gray-900">
              <Globe className="h-4 w-4 mr-2" />
              {i18n.language === "en" ? "RU" : "EN"}
            </button>
          </div>

          <div className="flex flex-wrap mx-6 gap-x-4 gap-y-2 justify-center text-gray-500">
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4" />
            </div>
            <Link href="https://t.me/tondev" target="_blank" className="flex items-center hover:text-gray-900">
              {t('footer.supportChatRU')}
            </Link>
            |
            <Link href="https://t.me/tondev_eng" target="_blank" className="flex items-center hover:text-gray-900">
              {t('footer.supportChatEN')}
            </Link>
          </div>
          <div className="flex flex-wrap mx-6 gap-x-4 gap-y-2 justify-center text-gray-500">
            <div className="flex items-center">
              <Github className="flex items-center h-4 w-4" />
            </div>
            <Link href="https://github.com/dearjohndoe/mytonstorage-backend" target="_blank" className="flex items-center hover:text-gray-900">
              {t('footer.backend')}
            </Link>
            |
            <Link href="https://github.com/dearjohndoe/mytonstorage-org" target="_blank" className="flex items-center hover:text-gray-900 ">
              {t('footer.frontend')}
            </Link>
            |
            <Link href="https://github.com/dearjohndoe/mytonstorage-gateway" target="_blank" className="flex items-center hover:text-gray-900">
              {t('footer.gateway')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
