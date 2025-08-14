import { translations as thaiTranslations } from './th';
import { translations as englishTranslations } from './en';

export const useTranslation = (language = 'th') => {
  const translations = language === 'en' ? englishTranslations : thaiTranslations;
  
  const t = (key, fallback = null) => {
    // If fallback is provided and key starts with translation object, use fallback
    if (fallback && typeof key === 'string') {
      const keys = key.split('.');
      let result = translations;
      
      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k];
        } else {
          return fallback; // Return fallback if translation not found
        }
      }
      
      return result || fallback;
    }
    
    // Original behavior for backward compatibility
    if (typeof key === 'string') {
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
    }
    
    return key;
  };

  return { t };
};
