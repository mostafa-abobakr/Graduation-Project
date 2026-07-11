import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ar from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
    saveMissing: true,
    missingKeyHandler: (lngs, ns, key, fallbackValue) => {
      if (import.meta.env?.DEV) {
        console.warn(`[i18next] Missing key: "${key}" in namespace "${ns}" and language "${lngs.join(', ')}"`);
      }
    },
    parseMissingKeyHandler: (key) => {
      const commonTokens = {
        'Optimal': 'مخزون مثالي',
        'Low Stock': 'مخزون منخفض',
        'Overstock': 'فائض في المخزون',
      };

      if (commonTokens[key]) {
        return commonTokens[key];
      }

      if (typeof key === 'string') {
        const cleaned = key.replace(/_/g, ' ').toLowerCase();
        return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
      }
      return key;
    }
  });

export default i18n;
