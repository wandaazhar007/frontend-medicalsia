import { createContext, useContext, useEffect, useState } from 'react';

const THEME_KEY = 'medicalsia:theme';
const LANGUAGE_KEY = 'medicalsia:language';

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || 'id');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  function toggleTheme() {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  }

  function toggleLanguage() {
    setLanguage((current) => (current === 'id' ? 'en' : 'id'));
  }

  return (
    <PreferencesContext.Provider value={{ theme, toggleTheme, language, toggleLanguage }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
