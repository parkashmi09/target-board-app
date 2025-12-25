import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import hi from '../locales/hi.json';

const resources = {
  en: {
    translation: en,
  },
  hi: {
    translation: hi,
  },
};

const LANGUAGE_STORAGE_KEY = '@app_language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // First, try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi')) {
        callback(savedLanguage);
        return;
      }

      // If no saved language, detect from device
      const locales = getLocales();
      const language = locales[0]?.languageCode || 'en';
      const detectedLanguage = language === 'hi' ? 'hi' : 'en';
      
      // Save detected language for future use
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, detectedLanguage);
      callback(detectedLanguage);
    } catch (error) {
      // Error detecting language - silent handling
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch (error) {
      // Error saving language - silent handling
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

