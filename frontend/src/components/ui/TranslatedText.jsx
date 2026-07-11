import React from 'react';
import { useTranslation } from 'react-i18next';

export const TranslatedText = ({ value, fallbackType }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const hasTranslation = i18n.hasResourceBundle(isArabic ? 'ar' : 'en', 'translation') && t(value) !== value;

  if (hasTranslation) {
    return <>{t(value)}</>;
  }

  // Fallback UI configuration for missing backend items
  return (
    <span 
      dir={isArabic ? "ltr" : "ltr"} 
      className={!hasTranslation && isArabic ? "inline-block font-sans px-1 rounded bg-muted/50 text-xs text-left" : ""}
    >
      {value}
    </span>
  );
};
