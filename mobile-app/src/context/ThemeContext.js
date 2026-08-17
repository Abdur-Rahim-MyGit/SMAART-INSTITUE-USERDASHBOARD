import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const darkColors = {
  theme: 'dark',
  bg: '#0B1220',                  // Main Dark BG
  bgSecondary: '#111827',         // Secondary Dark BG (Header)
  card: '#182235',                // Card background
  primary: '#2563EB',             // Accent Blue
  primaryBright: '#3B82F6',       // Primary Blue
  highlight: '#60A5FA',           // Highlight Blue
  text: '#FFFFFF',                // Main text color
  textMuted: '#A1A1AA',           // Secondary Text
  border: 'rgba(255,255,255,0.08)', // Thin grey border
  success: '#22C55E',             // Success green
  danger: '#EF4444',              // Danger red
  warning: '#F59E0B',             // Warning amber
  white: '#FFFFFF',
  black: '#000000',
  iconMuted: '#9CA3AF',
  pillBg: 'rgba(59, 130, 246, 0.15)',
};

export const lightColors = {
  theme: 'light',
  bg: '#F8FAFC',                  // Soft Light BG
  bgSecondary: '#F1F5F9',         // Secondary Light BG (Header)
  card: '#FFFFFF',                // Pure white card
  primary: '#2563EB',             // Accent Blue
  primaryBright: '#3B82F6',       // Primary Blue
  highlight: '#1D4ED8',           // Highlight Blue
  text: '#0F172A',                // Dark slate text
  textMuted: '#475569',           // Secondary text
  border: '#E5E7EB',              // Light grey border
  success: '#10B981',             // Success green
  danger: '#EF4444',              // Danger red
  warning: '#F59E0B',             // Warning amber
  white: '#FFFFFF',
  black: '#000000',
  iconMuted: '#64748B',
  pillBg: 'rgba(59, 130, 246, 0.08)',
};

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState(systemScheme === 'dark' ? 'dark' : 'light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
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
