"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { writeLS } from "@/lib/storage"
import { dict, type Locale, type DictKey } from "./dict"

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: DictKey) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    setLocaleState("en")
    writeLS("locale", "en")
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState("en")
    writeLS("locale", "en")
  }

  const t = (key: DictKey): string => {
    try {
      const translation = dict["en"]?.[key]
      if (translation === undefined) {
        console.warn(`[i18n] Missing translation for key: ${key}`)
        return key
      }
      return translation
    } catch (error) {
      console.error(`[i18n] Error translating key: ${key}`, error)
      return key
    }
  }

  return <I18nContext.Provider value={{ locale: "en", setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}
