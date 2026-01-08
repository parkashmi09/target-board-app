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
import { moderateScale } from '../responsive';

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

  // Font sizes (using moderateScale for responsive sizing)
  textSize10: { fontSize: moderateScale(10) },
  textSize12: { fontSize: moderateScale(12) },
  textSize14: { fontSize: moderateScale(14) },
  textSize16: { fontSize: moderateScale(16) },
  textSize18: { fontSize: moderateScale(18) },
  textSize20: { fontSize: moderateScale(20) },
  textSize22: { fontSize: moderateScale(22) },
  textSize24: { fontSize: moderateScale(24) },
  textSize26: { fontSize: moderateScale(26) },
  textSize28: { fontSize: moderateScale(28) },
  textSize30: { fontSize: moderateScale(30) },
  textSize32: { fontSize: moderateScale(32) },
  textSize36: { fontSize: moderateScale(36) },
  textSize40: { fontSize: moderateScale(40) },
  textSize48: { fontSize: moderateScale(48) },

  // Common typography combinations
  h1: {
    fontFamily: Font.Bold,
    fontSize: moderateScale(32),
    lineHeight: moderateScale(40),
  },
  h2: {
    fontFamily: Font.Bold,
    fontSize: moderateScale(24),
    lineHeight: moderateScale(32),
  },
  h3: {
    fontFamily: Font.SemiBold,
    fontSize: moderateScale(20),
    lineHeight: moderateScale(28),
  },
  body: {
    fontFamily: Font.Regular,
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
  },
  bodySmall: {
    fontFamily: Font.Regular,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  caption: {
    fontFamily: Font.Regular,
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
  },
  button: {
    fontFamily: Font.SemiBold,
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
  },
  label: {
    fontFamily: Font.Medium,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
};

export default Typography;

