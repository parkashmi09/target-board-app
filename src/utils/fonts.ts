/**
 * Font utility for Metropolis font family
 * Maps font weights to Metropolis font family names
 * 
 * This file maintains backward compatibility with existing code.
 * For new code, consider using Font constants from '../font' or Typography utilities.
 */

import Font from './font';

export const getFontFamily = (weight?: string | number): string => {
  const fontWeight = typeof weight === 'string' ? weight : weight?.toString();

  switch (fontWeight) {
    case '100':
    case '200':
      return Font.Thin;
    case '300':
      return Font.ExtraLight;
    case '400':
    case 'normal':
      return Font.Regular;
    case '500':
      return Font.Medium;
    case '600':
      return Font.SemiBold;
    case '700':
    case 'bold':
      return Font.Bold;
    case '800':
      return Font.ExtraBold;
    case '900':
      return Font.Black;
    default:
      return Font.Thin;
  }
};

export const fontFamily = {
  thin: Font.Thin,
  extraLight: Font.ExtraLight,
  light: Font.Light,
  regular: Font.Regular,
  medium: Font.Medium,
  semiBold: Font.SemiBold,
  bold: Font.Bold,
  extraBold: Font.ExtraBold,
  black: Font.Black,
};

// Re-export Font for convenience
export { default as Font } from './font';

