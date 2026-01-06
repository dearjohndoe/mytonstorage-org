"use client"

import { useState, useEffect, useRef } from "react";
import i18n, { type i18n as I18nType } from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import mainTranslationsEN from "../public/locales/en/main.json";
import mainTranslationsRU from "../public/locales/ru/main.json";

const LANG_STORAGE_KEY = 'preferred-language';
const SUPPORTED_LANGS = ['en', 'ru'];

function createI18nInstance(lang: string): I18nType {
  const instance = i18n.createInstance();
  instance
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: mainTranslationsEN },
        ru: { translation: mainTranslationsRU },
      },
      lng: lang,
      fallbackLng: "en",
      interpolation: { escapeValue: false },
    });
  
  return instance;
}

function getInitialLanguage(): string {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) {
      return stored;
    }
  } catch {}
  
  const browserLang = navigator.language.split('-')[0];
  return SUPPORTED_LANGS.includes(browserLang) ? browserLang : 'en';
}

export const i18nInstance = createI18nInstance('en');

if (typeof window !== 'undefined') {
  i18nInstance.on('languageChanged', (lng) => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lng);
    } catch {}
  });
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lang = getInitialLanguage();
    if (lang !== i18nInstance.language) {
      i18nInstance.changeLanguage(lang);
    }
  }, []);

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}
