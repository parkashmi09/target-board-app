/**
 * Font utility for Metropolis font family
 * Maps font weights to Metropolis font family names
 */

export const getFontFamily = (weight?: string | number): string => {
  const fontWeight = typeof weight === 'string' ? weight : weight?.toString();

  switch (fontWeight) {
    case '100':
    case '200':
      return 'Metropolis-Thin';
    case '300':
      return 'Metropolis-ExtraLight';
    case '400':
    case 'normal':
      return 'Metropolis-Regular';
    case '500':
      return 'Metropolis-Medium';
    case '600':
      return 'Metropolis-SemiBold';
    case '700':
    case 'bold':
      return 'Metropolis-Bold';
    case '800':
      return 'Metropolis-ExtraBold';
    case '900':
      return 'Metropolis-Black';
    default:
      return 'Metropolis-Regular';
  }
};

export const fontFamily = {
  thin: 'Metropolis-Thin',
  extraLight: 'Metropolis-ExtraLight',
  light: 'Metropolis-Light',
  regular: 'Metropolis-Regular',
  medium: 'Metropolis-Medium',
  semiBold: 'Metropolis-SemiBold',
  bold: 'Metropolis-Bold',
  extraBold: 'Metropolis-ExtraBold',
  black: 'Metropolis-Black',
};

