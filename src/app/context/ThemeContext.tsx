'use client';

import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ColorTheme {
  id: string;
  name: string;
  background: string;
  foreground: string;
  primary: string;
  primaryHover: string;
  accent: string;
  card: string;
}

interface ThemeContextType {
  currentTheme: string;
  customColors: Record<string, string>;
  setTheme: (themeId: string) => void;
  setCustomColors: (colors: Record<string, string>) => void;
  applyTheme: (theme: ColorTheme | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [customColors, setCustomColorsState] = useState({
    background: '#0f172a',
    foreground: '#f1f5f9',
    primary: '#14b8a6',
    primaryHover: '#0f766e',
    accent: '#f97316',
    card: '#1e293b'
  });

  const applyTheme = (theme: ColorTheme | null) => {
    const root = document.documentElement;
    
    if (theme) {
      root.style.setProperty('--background', theme.background);
      root.style.setProperty('--foreground', theme.foreground);
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--primary-hover', theme.primaryHover);
      root.style.setProperty('--accent', theme.accent);
      root.style.setProperty('--card', theme.card);
    } else {
      // Apply custom colors
      root.style.setProperty('--background', customColors.background);
      root.style.setProperty('--foreground', customColors.foreground);
      root.style.setProperty('--primary', customColors.primary);
      root.style.setProperty('--primary-hover', customColors.primaryHover);
      root.style.setProperty('--accent', customColors.accent);
      root.style.setProperty('--card', customColors.card);
    }
  };

  const setTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    
    if (session?.user?.id) {
      const userThemeKey = `lieferspatz-theme-${session.user.id}`;
      localStorage.setItem(userThemeKey, themeId);
    }
  };

  const setCustomColors = (colors: Record<string, string>) => {
    const typedColors = {
      background: colors.background || customColors.background,
      foreground: colors.foreground || customColors.foreground,
      primary: colors.primary || customColors.primary,
      primaryHover: colors.primaryHover || customColors.primaryHover,
      accent: colors.accent || customColors.accent,
      card: colors.card || customColors.card,
    };
    setCustomColorsState(typedColors);
    
    if (session?.user?.id) {
      const userCustomColorsKey = `lieferspatz-custom-colors-${session.user.id}`;
      localStorage.setItem(userCustomColorsKey, JSON.stringify(typedColors));
    }
  };

  useEffect(() => {
    // Reset to default when user logs out
    if (status === 'unauthenticated') {
      setCurrentTheme('default');
      setCustomColorsState({
        background: '#0f172a',
        foreground: '#f1f5f9',
        primary: '#14b8a6',
        primaryHover: '#0f766e',
        accent: '#f97316',
        card: '#1e293b'
      });
      return;
    }

    // Load saved theme from localStorage on mount or session change
    if (session?.user?.id) {
      const userThemeKey = `lieferspatz-theme-${session.user.id}`;
      const userCustomColorsKey = `lieferspatz-custom-colors-${session.user.id}`;
      
      const savedTheme = localStorage.getItem(userThemeKey);
      const savedCustomColors = localStorage.getItem(userCustomColorsKey);
      
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      } else {
        // New user - default theme
        setCurrentTheme('default');
      }
      
      if (savedCustomColors) {
        try {
          const parsedColors = JSON.parse(savedCustomColors);
          setCustomColorsState(parsedColors);
        } catch (error) {
          console.error('Error parsing saved custom colors:', error);
        }
      }
    }
  }, [session, status]);

  const value = {
    currentTheme,
    customColors,
    setTheme,
    setCustomColors,
    applyTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 