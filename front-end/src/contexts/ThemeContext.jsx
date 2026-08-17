import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { apiCall } from '../services/api';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  loading: true,
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);

  const applyTheme = (themeValue) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (themeValue === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
      return;
    }

    root.classList.add(themeValue);
  };

  const persistThemePreference = async (themeValue) => {
    localStorage.setItem('theme', themeValue);

    const token = sessionStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      await apiCall('/users/settings', {
        method: 'PUT',
        body: JSON.stringify({
          appearance: {
            theme: themeValue,
          },
        }),
      });
    } catch (error) {
      console.warn('Failed to persist theme preference:', error.message);
    }
  };

  const handleThemeChange = useCallback((newTheme, event) => {
    const isTransitionSupported =
      document.startViewTransition &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isTransitionSupported) {
      setTheme(newTheme);
      applyTheme(newTheme);
      persistThemePreference(newTheme);
      return;
    }

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    document.documentElement.style.setProperty('--x', `${x}px`);
    document.documentElement.style.setProperty('--y', `${y}px`);

    document.documentElement.classList.add('no-transitions');

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
        applyTheme(newTheme);
      });
      persistThemePreference(newTheme);
    });

    transition.ready.then(() => {
      document.documentElement.classList.remove('no-transitions');
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTheme = async () => {
      const fallbackTheme = localStorage.getItem('theme') || 'light';
      if (isMounted) {
        setTheme(fallbackTheme);
        applyTheme(fallbackTheme);
        setLoading(false);
      }

      const token = sessionStorage.getItem('token');
      if (!token) {
        return;
      }

      try {
        const response = await apiCall('/users/settings');
        const remoteTheme = response?.data?.appearance?.theme;

        if (isMounted && remoteTheme && remoteTheme !== fallbackTheme) {
          setTheme(remoteTheme);
          applyTheme(remoteTheme);
          localStorage.setItem('theme', remoteTheme);
        }
      } catch (error) {
        console.warn('Failed to load persisted theme:', error.message);
      }
    };

    loadTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme: handleThemeChange,
    loading
  }), [theme, handleThemeChange, loading]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
