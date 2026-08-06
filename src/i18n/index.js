import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import id from './locales/id';
import en from './locales/en';

// Initial language mirrors PreferencesContext's own localStorage read
// (medicalsia:language) so the very first render is already correct —
// PreferencesContext calls i18n.changeLanguage() on every toggle afterward.
const storedLanguage = localStorage.getItem('medicalsia:language') || 'id';

i18n.use(initReactI18next).init({
  resources: {
    id: { translation: id },
    en: { translation: en },
  },
  lng: storedLanguage,
  fallbackLng: 'id',
  interpolation: { escapeValue: false },
});

export default i18n;
