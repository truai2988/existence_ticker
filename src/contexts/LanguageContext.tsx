import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MESSAGES } from '../constants/messages';
import { MESSAGES_EN } from '../constants/messages_en';

type Language = 'ja' | 'en';

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  // Deep merging the JP dictionary with EN, falling back appropriately.
  t: typeof MESSAGES;
}

const LanguageContext = createContext<LanguageContextProps>({
  lang: 'ja',
  setLang: () => {},
  t: MESSAGES,
});

// Recursive merge function to safeguard against missing definitions in English
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge<T>(base: T, overlay: any): T {
  if (!overlay || typeof overlay !== 'object') return base;
  if (!base || typeof base !== 'object') return overlay;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = { ...base } as any;
  for (const key in overlay) {
    if (overlay[key] !== undefined) {
      if (typeof overlay[key] === 'object' && overlay[key] !== null && !Array.isArray(overlay[key])) {
        result[key] = deepMerge(result[key], overlay[key]);
      } else {
        result[key] = overlay[key];
      }
    }
  }
  return result;
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>('ja');

  useEffect(() => {
    // Only load from localStorage so it acts as user preference. Defaults to ja.
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang === 'en' || savedLang === 'ja') {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Language) => {
    localStorage.setItem('app_language', newLang);
    setLangState(newLang);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang === 'en') {
      document.body.classList.add('lang-en');
    } else {
      document.body.classList.remove('lang-en');
    }
  }, [lang]);

  // Combine MESSAGES safely. If an EN key is missing, it falls back to JP automatically.
  const t = lang === 'en' ? deepMerge(MESSAGES, MESSAGES_EN) : MESSAGES;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);
