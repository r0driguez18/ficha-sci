import { useState, useEffect, createContext, useContext, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'hc';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** true para escuro ou alto contraste — usado pelos gráficos. */
  isDarkMode: boolean;
}

const STORAGE_KEY = 'sci-theme';
const VALID: Theme[] = ['light', 'dark', 'hc'];

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  isDarkMode: false,
});

function readInitial(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID.includes(stored as Theme)) return stored as Theme;
    // Migração do valor antigo ('theme' = 'light'|'dark')
    const legacy = localStorage.getItem('theme');
    if (legacy === 'dark') return 'dark';
  } catch {
    /* localStorage indisponível */
  }
  return 'light';
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark' || theme === 'hc');
  root.classList.toggle('hc', theme === 'hc');
}

// Aplica o tema o mais cedo possível (antes do primeiro paint do React).
if (typeof document !== 'undefined') {
  apply(readInitial());
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(readInitial);

  useEffect(() => {
    apply(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignora */
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode: theme !== 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
