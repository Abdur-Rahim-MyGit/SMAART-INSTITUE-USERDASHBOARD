import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import translationEN from "./locales/en/translation.json";
import translationHI from "./locales/hi/translation.json";
import translationTA from "./locales/ta/translation.json";
import translationUR from "./locales/ur/translation.json";
import translationFR from "./locales/fr/translation.json";

const resources = {
  en: {
    translation: translationEN,
  },
  hi: {
    translation: translationHI,
  },
  ta: {
    translation: translationTA,
  },
  ur: {
    translation: translationUR,
  },
  fr: {
    translation: translationFR,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "cookie", "htmlTag"],
      caches: ["localStorage", "cookie"],
    },
  });

export default i18n;
