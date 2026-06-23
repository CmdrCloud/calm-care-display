import { useLanguage } from "./LanguageProvider";
import { es } from "./es";
import { type TranslationKeys, type Language } from "./translations";

export function useTranslation() {
  try {
    const context = useLanguage();
    return context;
  } catch (e) {
    // Fallback if context is not available (e.g., rendering before provider is mounted)
    return {
      t: es as TranslationKeys,
      language: "es" as Language,
      setLanguage: () => {},
    };
  }
}
