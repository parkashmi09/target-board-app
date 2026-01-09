# Font Fix Summary

## Issues Fixed

### 1. iOS Info.plist - Added UIAppFonts Array ✅
- **Problem**: iOS wasn't recognizing custom fonts because `UIAppFonts` key was missing
- **Fix**: Added all font files to `UIAppFonts` array in `ios/TestApp/Info.plist`
- **Files Added**:
  - Metropolis-Thin.otf
  - Metropolis-ExtraLight.otf
  - Metropolis-Light.otf
  - Metropolis-Regular.otf
  - Metropolis-Medium.otf
  - Metropolis-SemiBold.otf
  - Metropolis-Bold.otf
  - Metropolis-ExtraBold.otf
  - Metropolis-Black.otf
  - Poppins.ttf

### 2. Font Linking ✅
- **Problem**: Fonts weren't properly linked to native projects
- **Fix**: Ran `npx react-native-asset` to link fonts
- **Result**: Fonts are now in:
  - Android: `android/app/src/main/assets/fonts/`
  - iOS: Linked via Xcode project

### 3. Font Weight Mapping Bug ✅
- **Problem**: `getFontFamily('200')` was incorrectly returning `Font.Thin` instead of `Font.ExtraLight`
- **Fix**: Corrected the weight mapping in `src/utils/fonts.ts`:
  - '100' → Font.Thin
  - '200' → Font.ExtraLight (was incorrectly Thin)
  - '300' → Font.Light (was incorrectly ExtraLight)
  - '400' → Font.Regular
  - '500' → Font.Medium
  - '600' → Font.SemiBold
  - '700' → Font.Bold
  - '800' → Font.ExtraBold
  - '900' → Font.Black
  - default → Font.Regular (was Thin)

## Next Steps to Complete Font Setup

### 1. Rebuild the App
```bash
# For iOS
cd ios && pod install && cd ..
npx react-native run-ios

# For Android
npx react-native run-android
```

### 2. Verify Font Family Names
The font family names in `src/utils/font.ts` use the format `Metropolis-Thin`, `Metropolis-Bold`, etc.
These should match the PostScript names in the font files.

**If fonts still don't work after rebuilding**, the font family names might need to be different. To check the actual font names:

**On macOS:**
1. Double-click a font file
2. Check the "Full Name" or "PostScript Name" in Font Book

**Alternative method:**
- The font family name might be just "Metropolis" and you'd need to use `fontWeight` separately
- Or the PostScript names might be slightly different

### 3. Test Fonts in App
Create a test screen to verify all font weights are working:
```typescript
import Font from '@src/utils/font';

<Text style={{ fontFamily: Font.Thin }}>Thin</Text>
<Text style={{ fontFamily: Font.Regular }}>Regular</Text>
<Text style={{ fontFamily: Font.Bold }}>Bold</Text>
```

## Current Font Configuration

### Font Files Location
- Source: `src/assets/fonts/`
- Android: `android/app/src/main/assets/fonts/` (auto-linked)
- iOS: Linked via Xcode project (auto-linked)

### Font Constants (`src/utils/font.ts`)
```typescript
const Font = {
  Thin: 'Metropolis-Thin',
  ExtraLight: 'Metropolis-ExtraLight',
  Light: 'Metropolis-Light',
  Regular: 'Metropolis-Regular',
  Medium: 'Metropolis-Medium',
  SemiBold: 'Metropolis-SemiBold',
  Bold: 'Metropolis-Bold',
  ExtraBold: 'Metropolis-ExtraBold',
  Black: 'Metropolis-Black',
  Poppins: 'Poppins',
};
```

### React Native Config (`react-native.config.js`)
```javascript
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts/'],
};
```

## Troubleshooting

If fonts still don't work after rebuilding:

1. **Check Font Family Names**: The names in `font.ts` must exactly match the PostScript names in the font files
2. **Clear Cache**: `npx react-native start --reset-cache`
3. **Clean Build**: 
   - iOS: Clean build folder in Xcode
   - Android: `cd android && ./gradlew clean && cd ..`
4. **Verify Font Files**: Ensure all font files are present in both source and linked locations
5. **Check Console**: Look for font loading errors in the console

## Files Modified

1. `ios/TestApp/Info.plist` - Added UIAppFonts array
2. `src/utils/fonts.ts` - Fixed font weight mapping
3. Fonts linked via `npx react-native-asset`

