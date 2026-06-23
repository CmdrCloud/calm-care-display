import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, type TranslationKeys, type Language, DEFAULT_LANGUAGE } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Default to 'es' (Spanish) as requested
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("carecircle_lang");
        return (saved as Language) || DEFAULT_LANGUAGE;
      } catch (e) {
        // Ignore
      }
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("carecircle_lang", lang);
      } catch (e) {
        // Ignore
      }
    }
  };

  useEffect(() => {
    // Dynamic html tag update for lang attributes & accessibility
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language] || translations[DEFAULT_LANGUAGE],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
