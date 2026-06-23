import { es } from "./es";
import { en } from "./en";

export type TranslationKeys = typeof es;

export const translations = {
  es,
  en,
};

export type Language = "es" | "en";
export const DEFAULT_LANGUAGE: Language = "es";
