export const Images = {
  TB_LOGO: require('./tblogo.webp'),
  EDUCATION_PATTERN: require('./bg.jpg'),
  OTP_BACKGROUND: require('./otp.jpg'),
  LOGIN_BG: require('./login-bg.jpg'),
  NAME_ILLUSTRATION: require('./name.jpg'),
  TEACHER: require('./teacher.webp'),
  BADGE_STRIPE: require('./strip.webp'),
  NEW_BADGE: require('./new.webp'),
  TOP_RIGHT_BG: require('./top-right.webp'),
  BOTTOM_ROUND_BG: require('./bottom-round.webp'),
  LEFT_FLOWER: require('./left-flower.webp'),
  RIGHT_FLOWER: require('./right-flower.webp'),
  DARK_BELL: require('./dark-bell.webp'),
} as const;

export type ImageKey = keyof typeof Images;


