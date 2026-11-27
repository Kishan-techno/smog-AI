import { createContext, useContext, useEffect, useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations';

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('smog_saathi_lang');
    return saved === 'hi' || saved === 'hinglish' ? saved : 'en';
  });

  useEffect(() => {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
  }, [lang]);

  const setLang = (next) => {
    setLangState(next);
    localStorage.setItem('smog_saathi_lang', next);
  };

  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}