import { Dimensions, PixelRatio, Platform } from 'react-native';

// Base dimensions (iPhone 12/13 standard)
const baseWidth = 390;
const baseHeight = 844;

// Lazy get dimensions to avoid issues at module load time
const getDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (e) {
    return { width: baseWidth, height: baseHeight };
  }
};

/**
 * Scale based on screen width
 */
export const scale = (size: number): number => {
  const { width: SCREEN_WIDTH } = getDimensions();
  const scaleWidth = SCREEN_WIDTH / baseWidth;
  return size * scaleWidth;
};

/**
 * Scale based on screen height
 */
export const verticalScale = (size: number): number => {
  const { height: SCREEN_HEIGHT } = getDimensions();
  const scaleHeight = SCREEN_HEIGHT / baseHeight;
  return size * scaleHeight;
};

/**
 * Moderate scale - less aggressive scaling
 * Safeguarded to prevent negative values that cause Android crashes
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const { width: SCREEN_WIDTH } = getDimensions();
  // Prevent division by zero or negative screen dimensions
  if (SCREEN_WIDTH <= 0) {
    return Math.max(size, 0);
  }
  const scaled = size + (scale(size) - size) * factor;
  // Prevent negative values - critical for fontSize and letterSpacing
  return Math.max(scaled, 0);
};

/**
 * Get responsive font size
 */
export const getFontSize = (size: number): number => {
  const { width: SCREEN_WIDTH } = getDimensions();
  const scaleFactor = SCREEN_WIDTH / baseWidth;
  const newSize = size * scaleFactor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Get responsive dimensions
 */
export const getResponsiveDimensions = () => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = getDimensions();
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    scale,
    verticalScale,
    moderateScale,
  };
};

/**
 * Check if device is tablet
 */
export const isTablet = (): boolean => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = getDimensions();
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return (
    (Platform.OS === 'ios' && aspectRatio < 1.6) ||
    (Platform.OS === 'android' && SCREEN_WIDTH >= 600)
  );
};

/**
 * Get responsive padding/margin
 */
export const getSpacing = (multiplier: number = 1): number => {
  return moderateScale(8 * multiplier);
};

/**
 * Safe font size - ensures positive value to prevent Android crashes
 * @param size - Base font size
 * @param min - Minimum allowed font size (default: 10)
 */
export const safeFont = (size: number, min: number = 10): number => {
  const scaled = moderateScale(size);
  return Math.max(scaled, min);
};

/**
 * Safe letter spacing - ensures non-negative value to prevent Android crashes
 * @param value - Letter spacing value
 */
export const safeLetterSpacing = (value: number): number => {
  return Math.max(value, 0);
};

