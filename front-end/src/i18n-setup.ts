import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import translationEN from "./locales/en/translation.json";
import translationHI from "./locales/hi/translation.json";
import translationTA from "./locales/ta/translation.json";
import translationUR from "./locales/ur/translation.json";
import translationFR from "./locales/fr/translation.json";
import translationTE from "./locales/te/translation.json";
import translationKN from "./locales/kn/translation.json";
import translationML from "./locales/ml/translation.json";
import translationPA from "./locales/pa/translation.json";

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
  te: {
    translation: translationTE,
  },
  kn: {
    translation: translationKN,
  },
  ml: {
    translation: translationML,
  },
  pa: {
    translation: translationPA,
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
