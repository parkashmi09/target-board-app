# Font Family Setup Guide

This document explains the font family setup approach used in this React Native project.

## Overview

This project uses a centralized font management system with:
1. Font files stored in `src/assets/fonts/`
2. React Native configuration for font linking
3. Font constants file for easy reference
4. Typography utilities for consistent styling

## Project Structure

```
project-root/
├── react-native.config.js          # Font asset configuration
├── src/
│   ├── assets/
│   │   └── fonts/                   # Font files location
│   │       ├── Metropolis-Thin.otf
│   │       ├── Metropolis-ExtraLight.otf
│   │       ├── Metropolis-Light.otf
│   │       ├── Metropolis-Regular.otf
│   │       ├── Metropolis-Medium.otf
│   │       ├── Metropolis-SemiBold.otf
│   │       ├── Metropolis-Bold.otf
│   │       ├── Metropolis-ExtraBold.otf
│   │       ├── Metropolis-Black.otf
│   │       └── Poppins.ttf
│   └── utils/
│       ├── font.ts                  # Font constants
│       ├── fonts.ts                 # Font utilities (backward compatible)
│       └── typography/
│           └── index.ts             # Typography utilities
```

## Available Font Files

**Metropolis Font Family:**
- Metropolis-Thin.otf
- Metropolis-ExtraLight.otf
- Metropolis-Light.otf
- Metropolis-Regular.otf
- Metropolis-Medium.otf
- Metropolis-SemiBold.otf
- Metropolis-Bold.otf
- Metropolis-ExtraBold.otf
- Metropolis-Black.otf

**Other Fonts:**
- Poppins.ttf

## Usage Examples

### Method 1: Using Font Constants (Recommended for new code)

```typescript
import Font from '../utils/font';

<Text style={{ fontFamily: Font.Bold, fontSize: 16 }}>
  Bold Text
</Text>

<Text style={{ fontFamily: Font.Thin, fontSize: 14 }}>
  Thin Text
</Text>
```

### Method 2: Using Typography Utilities (Recommended for consistent styling)

```typescript
import Typography from '../utils/typography';

// Using predefined combinations
<Text style={Typography.h1}>
  Heading 1
</Text>

<Text style={Typography.body}>
  Body text
</Text>

// Combining font family and size
<Text style={[Typography.fontBold, Typography.textSize24]}>
  Bold 24px Text
</Text>

// Combining with other styles
<Text style={[
  Typography.fontMedium,
  Typography.textSize14,
  { color: '#333333' }
]}>
  Medium 14px Text
</Text>
```

### Method 3: Using Font Utilities (Backward compatible)

```typescript
import { getFontFamily, fontFamily } from '../utils/fonts';

// Using getFontFamily with weight
<Text style={{ fontFamily: getFontFamily('bold'), fontSize: 16 }}>
  Bold Text
</Text>

// Using fontFamily object
<Text style={{ fontFamily: fontFamily.bold, fontSize: 16 }}>
  Bold Text
</Text>
```

## Available Typography Styles

### Font Families
- `Typography.fontThin`
- `Typography.fontExtraLight`
- `Typography.fontLight`
- `Typography.fontRegular`
- `Typography.fontMedium`
- `Typography.fontSemiBold`
- `Typography.fontBold`
- `Typography.fontExtraBold`
- `Typography.fontBlack`
- `Typography.fontPoppins`

### Font Sizes
- `Typography.textSize10` through `Typography.textSize48`

### Predefined Combinations
- `Typography.h1` - Bold, 32px, lineHeight 40
- `Typography.h2` - Bold, 24px, lineHeight 32
- `Typography.h3` - SemiBold, 20px, lineHeight 28
- `Typography.body` - Regular, 16px, lineHeight 24
- `Typography.bodySmall` - Regular, 14px, lineHeight 20
- `Typography.caption` - Regular, 12px, lineHeight 16
- `Typography.button` - SemiBold, 16px, lineHeight 24
- `Typography.label` - Medium, 14px, lineHeight 20

## Configuration Files

### react-native.config.js

```javascript
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts/'],
};
```

This tells React Native where to find your font assets.

## Linking Fonts

**For React Native 0.60+ (Auto-linking):**
Fonts are auto-linked via `react-native.config.js`. After adding new fonts:

```bash
# For iOS
cd ios && pod install && cd ..

# For Android
# No additional steps needed, fonts are auto-linked
```

**Rebuild the app:**
- iOS: `npx react-native run-ios`
- Android: `npx react-native run-android`

## Verification Steps

1. ✅ Check font files exist in `src/assets/fonts/`
2. ✅ Verify `react-native.config.js` points to the correct path
3. ✅ Run `pod install` (iOS): `cd ios && pod install`
4. ✅ Rebuild the app
5. ✅ Test in code: Apply a font style and verify it renders correctly

## Troubleshooting

### Fonts not showing?

1. **Check font family name**: The name in `font.ts` must exactly match the font's internal family name
2. **Verify file format**: React Native supports `.ttf`, `.otf`, and `.woff` (iOS only)
3. **Clear cache**: `npx react-native start --reset-cache`
4. **Rebuild**: Clean and rebuild the native projects
5. **Check linking**: Verify fonts appear in:
   - `android/app/src/main/assets/fonts/` (Android)
   - iOS project fonts folder

### Finding the correct font family name:
- **macOS**: Right-click font file → Get Info → Check "Full Name"
- **Windows**: Right-click font file → Properties → Details tab
- **Online**: Use a font viewer tool or check font metadata

## Key Points to Remember

1. ✅ Font files go in `src/assets/fonts/`
2. ✅ Configure path in `react-native.config.js`
3. ✅ Font names in code must match font file's internal family name
4. ✅ Run `pod install` for iOS after adding fonts
5. ✅ Rebuild native apps after adding new fonts
6. ✅ Use Typography utilities for consistent styling across the app

---

**This setup ensures:**
- Centralized font management
- Type-safe font references (with TypeScript)
- Easy maintenance and updates
- Consistent typography across the app
- No hardcoded font names scattered in components

