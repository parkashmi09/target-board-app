import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, ColorScheme, lightColors, darkColors } from './colors';
import { getFontFamily } from '../utils/fonts';

const THEME_KEY = '@theme_mode';

const getThemeFromStorage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(THEME_KEY);
  } catch (error) {
    return null;
  }
};

const setThemeToStorage = async (value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_KEY, value);
  } catch (error) {
    // Silent error handling
  }
};

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  colors: ColorScheme;
  mode: ThemeMode;
  isDark: boolean;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
  typography: {
    h1: {
      fontSize: number;
      fontWeight: 'bold' | 'normal' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
      lineHeight: number;
      fontFamily: string;
    };
    h2: {
      fontSize: number;
      fontWeight: 'bold' | 'normal' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
      lineHeight: number;
      fontFamily: string;
    };
    h3: {
      fontSize: number;
      fontWeight: 'bold' | 'normal' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
      lineHeight: number;
      fontFamily: string;
    };
    body: {
      fontSize: number;
      fontWeight: 'bold' | 'normal' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
      lineHeight: number;
      fontFamily: string;
    };
    caption: {
      fontSize: number;
      fontWeight: 'bold' | 'normal' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
      lineHeight: number;
      fontFamily: string;
    };
  };
}

interface ThemeContextType {
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '200' as const,
    lineHeight: 40,
    fontFamily: getFontFamily('200'),
  },
  h2: {
    fontSize: 24,
    fontWeight: '200' as const,
    lineHeight: 32,
    fontFamily: getFontFamily('200'),
  },
  h3: {
    fontSize: 20,
    fontWeight: '200' as const,
    lineHeight: 28,
    fontFamily: getFontFamily('200'),
  },
  body: {
    fontSize: 16,
    fontWeight: '200' as const,
    lineHeight: 24,
    fontFamily: getFontFamily('200'),
  },
  caption: {
    fontSize: 14,
    fontWeight: '200' as const,
    lineHeight: 20,
    fontFamily: getFontFamily('200'),
  },
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isDark, setIsDark] = useState(false);

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await getThemeFromStorage();
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
        setThemeModeState(savedTheme as ThemeMode);
      } else {
        // Default to light theme if no saved preference
        setThemeModeState('light');
        await setThemeToStorage('light');
      }
    };
    loadTheme();
  }, []);

  // Update isDark based on theme mode and system preference
  useEffect(() => {
    if (themeMode === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode, systemColorScheme]);

  const currentColors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    setThemeToStorage(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((prevMode) => {
      let newMode: ThemeMode;
      if (prevMode === 'dark') {
        newMode = 'light';
      } else if (prevMode === 'light') {
        newMode = 'dark';
      } else {
        // If system mode, toggle to opposite of current system
        newMode = systemColorScheme === 'dark' ? 'light' : 'dark';
      }
      // Save to storage asynchronously (don't await to avoid blocking)
      setThemeToStorage(newMode);
      return newMode;
    });
  }, [systemColorScheme]);

  const theme: Theme = useMemo(() => ({
    colors: currentColors,
    mode: themeMode,
    isDark,
    spacing,
    borderRadius,
    typography,
  }), [currentColors, themeMode, isDark]);

  const contextValue = useMemo(() => ({
    theme,
    setThemeMode,
    toggleTheme,
  }), [theme, setThemeMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if used outside provider - default to light theme
    return {
      colors: lightColors,
      mode: 'light',
      isDark: false,
      spacing,
      borderRadius,
      typography,
    };
  }
  return context.theme;
};

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};

