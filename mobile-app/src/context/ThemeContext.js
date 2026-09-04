import React, { createContext, useContext, useEffect, useState } from 'react';
import * as storage from '../utils/storage';

const ThemeContext = createContext();
const THEME_STORAGE_KEY = 'smaart_pref_theme';

// SMAART Institute brand palette — Obsidian Navy (#072036), Cyber Blue (#045C9A),
// Sky (#A6D7E8) and Ice (#EAF7FD), kept in sync with src/theme.js.
export const darkColors = {
  theme: 'dark',
  bg: '#071B2C',                  // Main Dark BG — brand navy
  bgSecondary: '#0A2942',         // Secondary Dark BG (Header)
  card: '#0E3555',                // Card background
  primary: '#045C9A',             // Accent Blue
  primaryBright: '#2B8FCC',       // Primary Blue
  highlight: '#6EC6EA',           // Highlight — sky blue
  text: '#FFFFFF',                // Main text color
  textMuted: '#9FC3D6',           // Secondary Text
  border: 'rgba(166,215,232,0.12)', // Thin sky-tinted border
  success: '#22C55E',             // Success green
  danger: '#EF4444',              // Danger red
  warning: '#F59E0B',             // Warning amber
  cream: '#FFF0C7',               // Warm accent
  white: '#FFFFFF',
  black: '#000000',
  iconMuted: '#7FA8BD',
  pillBg: 'rgba(4, 92, 154, 0.22)',
};

export const lightColors = {
  theme: 'light',
  bg: '#EAF7FD',                  // Soft Light BG — brand ice
  bgSecondary: '#DDEFF8',         // Secondary Light BG (Header)
  card: '#FFFFFF',                // Pure white card
  primary: '#045C9A',             // Accent Blue
  primaryBright: '#0E74B7',       // Primary Blue
  highlight: '#023F6B',           // Highlight — deep blue
  text: '#072036',                // Brand navy text
  textMuted: '#4C7086',           // Secondary text
  border: '#CFE7F3',              // Light sky-tinted border
  success: '#10B981',             // Success green
  danger: '#EF4444',              // Danger red
  warning: '#F59E0B',             // Warning amber
  cream: '#FFF0C7',               // Warm accent
  white: '#FFFFFF',
  black: '#000000',
  iconMuted: '#5A7E92',
  pillBg: 'rgba(4, 92, 154, 0.08)',
};

export function ThemeProvider({ children }) {
  // Always default to 'light' (White theme) on first launch as requested
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await storage.getItem(THEME_STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
          setTheme(saved);
        }
      } catch (err) {
        // Fallback silently
      }
    })();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      storage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
