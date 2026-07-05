import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ar from "../locales/ar/ar.json";
import fr from "../locales/fr/fr.json";
import en from "../locales/en/en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: "ar",   // default language
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;