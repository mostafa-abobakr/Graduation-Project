import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Check local storage or default to 'en'
    const savedLang = localStorage.getItem('app_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    // Apply RTL or LTR direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('app_language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const t = (key) => {
    // Simple translation dictionary for demo purposes
    const translations = {
      en: {
        "Inventory Tracking": "Inventory Tracking",
        "Overview": "Overview",
        "Forecast": "Forecast",
        "Menu Analytics": "Menu Analytics",
        "Revenue": "Revenue",
        "AI Insights": "AI Insights",
        "Menu Management": "Menu Management",
        "Staff": "Staff",
        "Schedule": "Schedule",
        "Inventory": "Inventory",
        "Add Stock": "Add Stock",
        "Alerts": "Alerts",
        "Reports": "Reports",
        "Settings": "Settings",
        "Log out": "Log out",
        "Total items in stock": "Total items in stock",
        "Low stock items": "Low stock items",
        "Expiring soon": "Expiring soon",
        "Search...": "Search...",
      },
      ar: {
        "Inventory Tracking": "تتبع المخزون",
        "Overview": "نظرة عامة",
        "Forecast": "توقعات",
        "Menu Analytics": "تحليلات القائمة",
        "Revenue": "إيرادات",
        "AI Insights": "رؤى الذكاء الاصطناعي",
        "Menu Management": "إدارة القائمة",
        "Staff": "الموظفين",
        "Schedule": "الجدول الزمني",
        "Inventory": "المخزون",
        "Add Stock": "إضافة مخزون",
        "Alerts": "التنبيهات",
        "Reports": "التقارير",
        "Settings": "الإعدادات",
        "Log out": "تسجيل خروج",
        "Total items in stock": "إجمالي العناصر في المخزون",
        "Low stock items": "عناصر المخزون المنخفض",
        "Expiring soon": "تنتهي صلاحيتها قريباً",
        "Search...": "بحث...",
      }
    };
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
