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
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
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

