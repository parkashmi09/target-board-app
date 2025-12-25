/**
 * Color Theme Configuration
 * Based on TARGET BOARD design system
 * Primary: White
 * Secondary: Black
 * Accent: Yellow
 */

export const lightColors = {
  // Primary Colors
  primary: '#FFFFFF',
  primaryText: '#000000',

  // Secondary Colors
  secondary: '#000000',
  secondaryText: '#FFFFFF',

  // Accent Colors
  accent: '#FFD700', // Yellow/Gold
  accentDark: '#FFA500', // Darker yellow for hover states

  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5DC', // Light beige/cream
  backgroundTertiary: '#F0F0F0',

  // Text Colors
  text: '#000000',
  textSecondary: '#666666',
  textLight: '#999999',
  textInverse: '#FFFFFF',

  // Border Colors
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  borderDark: '#CCCCCC',

  // Input Colors
  inputBackground: '#EDEDED',

  // Status Colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  yellow: '#FFF176',

  // Navigation
  navBackground: '#1A1A2E', // Dark blue/black
  navText: '#FFFFFF',
  navActive: '#FFD700',

  // Card Colors
  cardBackground: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.1)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const darkColors = {
  // Primary Colors
  primary: '#1A1A2E',
  primaryText: '#FFFFFF',

  // Secondary Colors
  secondary: '#FFFFFF',
  secondaryText: '#000000',

  // Accent Colors
  accent: '#FFD700', // Yellow/Gold (same as light)
  accentDark: '#FFA500', // Darker yellow for hover states

  // Background Colors
  background: '#121212',
  backgroundSecondary: '#1E1E1E', // Dark gray
  backgroundTertiary: '#2A2A2A',
  yellow: '#FFF176',

  // Text Colors
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textLight: '#808080',
  textInverse: '#000000',

  // Border Colors
  border: '#333333',
  borderLight: '#2A2A2A',
  borderDark: '#404040',

  // Input Colors
  inputBackground: '#1E1E1E',

  // Status Colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',

  // Navigation
  navBackground: '#1f1e1d', // Black
  navText: '#FFFFFF',
  navActive: '#FFD700',

  // Card Colors
  cardBackground: '#1E1E1E',
  cardShadow: 'rgba(0, 0, 0, 0.5)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export type ColorScheme = typeof lightColors;

export const colors: ColorScheme = lightColors;

