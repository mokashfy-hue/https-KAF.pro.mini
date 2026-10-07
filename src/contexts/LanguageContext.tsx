import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "ar" | "en";

interface LanguageContextType {
  lang: Language;
  isRtl: boolean;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (arText: string, enText: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ar",
  isRtl: true,
  toggleLanguage: () => {},
  setLanguage: () => {},
  t: (ar) => ar,
});

const STORAGE_KEY = "kaf_pro_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved === "ar" || saved === "en") return saved;
    }
    return "ar";
  });

  const isRtl = lang === "ar";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      document.documentElement.lang = lang;
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }, [lang, isRtl]);

  const toggleLanguage = () => {
    setLangState((prev) => (prev === "ar" ? "en" : "ar"));
  };

  const setLanguage = (newLang: Language) => {
    setLangState(newLang);
  };

  const t = (arText: string, enText: string) => {
    return lang === "ar" ? arText : enText;
  };

  return (
    <LanguageContext.Provider value={{ lang, isRtl, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
