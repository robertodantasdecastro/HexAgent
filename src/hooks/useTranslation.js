import { useEffect, useState } from 'react';
import en from '../locales/en.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';

const messages = { en, pt, es };

export const useTranslation = (config) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (config?.ai?.language && config.ai.language !== 'auto') {
        setLanguage(config.ai.language);
    } else {
        // Simple browser detection or default to en
        const browserLang = navigator.language.split('-')[0];
        if (['pt', 'es'].includes(browserLang)) {
            setLanguage(browserLang);
        } else {
            setLanguage('en');
        }
    }
  }, [config]);

  const t = (key) => {
    const keys = key.split('.');
    let value = messages[language];
    for (const k of keys) {
        if (!value) break;
        value = value[k];
    }
    return value || key;
  };
  
  return { t, language };
};
