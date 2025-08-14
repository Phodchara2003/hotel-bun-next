import { translations as thaiTranslations } from './th';
import { translations as englishTranslations } from './en';

export const useTranslation = (language = 'th') => {
  const translations = language === 'en' ? englishTranslations : thaiTranslations;
  
  const t = (key) => {
    const keys = key.split('.');
    let result = translations;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        console.warn(`Translation key '${key}' not found for language '${language}'`);
        return key; // Return the key itself if translation not found
      }
    }
    
    return result || key;
  };

  return { t };
};
