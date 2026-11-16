import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { STORAGE_KEYS } from '@shared/constants';
import { getFromStorage, setToStorage } from '@shared/utils';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Check for stored theme preference
    const storedTheme = getFromStorage<Theme>(STORAGE_KEYS.THEME) || 'light';
    setTheme(storedTheme);

    // Apply theme to document
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setToStorage(STORAGE_KEYS.THEME, newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}