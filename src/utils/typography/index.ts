/**
 * Typography Utilities
 * 
 * Centralized typography styles for consistent text styling across the app.
 * Combines font families with common font sizes and weights.
 * 
 * Usage:
 * import Typography from '@src/utils/typography';
 * 
 * <Text style={[Typography.fontBold, Typography.textSize24]}>
 *   Bold 24px Text
 * </Text>
 */

import Font from '../font';
import { moderateScale, safeFont } from '../responsive';

const Typography = {
  // Font family styles
  fontThin: { fontFamily: Font.Thin },
  fontExtraLight: { fontFamily: Font.ExtraLight },
  fontLight: { fontFamily: Font.Light },
  fontRegular: { fontFamily: Font.Regular },
  fontMedium: { fontFamily: Font.Medium },
  fontSemiBold: { fontFamily: Font.SemiBold },
  fontBold: { fontFamily: Font.Bold },
  fontExtraBold: { fontFamily: Font.ExtraBold },
  fontBlack: { fontFamily: Font.Black },
  fontPoppins: { fontFamily: Font.Poppins },

  // Font sizes (using safeFont for responsive sizing - prevents negative values)
  textSize10: { fontSize: safeFont(10) },
  textSize12: { fontSize: safeFont(12) },
  textSize14: { fontSize: safeFont(14) },
  textSize16: { fontSize: safeFont(16) },
  textSize18: { fontSize: safeFont(18) },
  textSize20: { fontSize: safeFont(20) },
  textSize22: { fontSize: safeFont(22) },
  textSize24: { fontSize: safeFont(24) },
  textSize26: { fontSize: safeFont(26) },
  textSize28: { fontSize: safeFont(28) },
  textSize30: { fontSize: safeFont(30) },
  textSize32: { fontSize: safeFont(32) },
  textSize36: { fontSize: safeFont(36) },
  textSize40: { fontSize: safeFont(40) },
  textSize48: { fontSize: safeFont(48) },

  // Common typography combinations
  h1: {
    fontFamily: Font.Bold,
    fontSize: safeFont(32),
    lineHeight: safeFont(40, 32),
  },
  h2: {
    fontFamily: Font.Bold,
    fontSize: safeFont(24),
    lineHeight: safeFont(32, 24),
  },
  h3: {
    fontFamily: Font.SemiBold,
    fontSize: safeFont(20),
    lineHeight: safeFont(28, 20),
  },
  body: {
    fontFamily: Font.Regular,
    fontSize: safeFont(16),
    lineHeight: safeFont(24, 18),
  },
  bodySmall: {
    fontFamily: Font.Regular,
    fontSize: safeFont(14),
    lineHeight: safeFont(20, 16),
  },
  caption: {
    fontFamily: Font.Regular,
    fontSize: safeFont(12),
    lineHeight: safeFont(16, 14),
  },
  button: {
    fontFamily: Font.SemiBold,
    fontSize: safeFont(16),
    lineHeight: safeFont(24, 18),
  },
  label: {
    fontFamily: Font.Medium,
    fontSize: safeFont(14),
    lineHeight: safeFont(20, 16),
  },
};

export default Typography;

