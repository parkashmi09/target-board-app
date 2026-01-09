# Screen Fonts Fix Summary

## ✅ Fixed Screens

The following screens have been updated to properly use custom Metropolis fonts:

### Auth Screens
1. **LandingPage.tsx** ✅
   - Fixed all `getFontFamily('200')` to use correct weights based on `fontWeight` values
   - Removed conflicting `fontWeight` properties
   - Updated: largestText (600), destinationText (400), dividerText (400), label (500), input (400), buttonText (700)

2. **OtpVerificationScreen.tsx** ✅
   - Added `getFontFamily` import
   - Replaced `fontWeight: 'bold'` with `fontFamily: getFontFamily('700')`
   - Replaced `fontWeight: '600'` with `fontFamily: getFontFamily('600')`
   - Replaced `fontWeight: '700'` with `fontFamily: getFontFamily('700')`
   - Updated OTP input text style

3. **RegisterStep1Screen.tsx** ✅
   - Added `getFontFamily` import
   - Replaced all `fontWeight` with proper `fontFamily` using `getFontFamily`
   - Updated: title (700), subtitle (400), label (500), input (400), buttonText (700)

4. **RegisterStep2Screen.tsx** ✅
   - Added `getFontFamily` import
   - Replaced all `fontWeight` with proper `fontFamily` using `getFontFamily`
   - Updated: headerTitle (600), sectionTitle (500), label (500), input (400), classText (400/600), boardName (500/600), modalTitle (600), mediumName (500)

### Other Screens
5. **HelpScreen.tsx** ✅
   - Added `getFontFamily` import
   - Replaced `fontWeight: '800'` with `fontFamily: getFontFamily('800')`
   - Replaced `fontWeight: '700'` with `fontFamily: getFontFamily('700')`
   - Added fontFamily to: subTitle (400), cardSubtitle (400), infoText (400)

6. **SettingsScreen.tsx** ✅
   - Added `getFontFamily` import
   - Replaced all `fontWeight` with proper `fontFamily` using `getFontFamily`
   - Updated: language buttons (600), sectionTitle (500), itemText (400), logoutText (600)

## ⚠️ Remaining Screens to Fix

The following screens still need font fixes. They use `fontWeight` without proper `fontFamily`:

1. **QRCodePaymentScreen.tsx**
2. **PaymentCheckoutScreen.tsx**
3. **CategoryContentScreen.tsx**
4. **ClassStreamsScreen.tsx**
5. **BatchesScreen.tsx**
6. **StreamPlayerScreen.tsx**
7. **TermsAndConditionsScreen.tsx**
8. **PrivacyPolicyScreen.tsx**
9. **CourseDetailsScreen.tsx**
10. **ChooseBoardClassScreen.tsx**
11. **NotesScreen.tsx**
12. **TestsScreen.tsx**
13. **CategoriesScreen.tsx**
14. **EditProfileScreen.tsx**
15. **PDFDownlaodScreen.tsx**
16. **PDFViewerScreen.tsx**
17. **DownloadsScreen.tsx**
18. **TeacherDetailsScreen.tsx**

## How to Fix Remaining Screens

For each remaining screen, follow this pattern:

### Step 1: Add Import
```typescript
import { getFontFamily } from '../utils/fonts';
// or
import Font from '../utils/font';
// or
import Typography from '../utils/typography';
```

### Step 2: Replace fontWeight with fontFamily

**Before:**
```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  text: {
    fontSize: 14,
    fontWeight: '400',
  },
});
```

**After:**
```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontFamily: getFontFamily('600'), // SemiBold
  },
  text: {
    fontSize: 14,
    fontFamily: getFontFamily('400'), // Regular
  },
});
```

### Step 3: Font Weight Mapping

When replacing `fontWeight`, use this mapping:
- `'100'` → `getFontFamily('100')` or `Font.Thin`
- `'200'` → `getFontFamily('200')` or `Font.ExtraLight`
- `'300'` → `getFontFamily('300')` or `Font.Light`
- `'400'` or `'normal'` → `getFontFamily('400')` or `Font.Regular`
- `'500'` → `getFontFamily('500')` or `Font.Medium`
- `'600'` → `getFontFamily('600')` or `Font.SemiBold`
- `'700'` or `'bold'` → `getFontFamily('700')` or `Font.Bold`
- `'800'` → `getFontFamily('800')` or `Font.ExtraBold`
- `'900'` → `getFontFamily('900')` or `Font.Black`

### Step 4: Remove Conflicting fontWeight

**Important:** When using custom font families, remove the `fontWeight` property as it conflicts with the font family name. The weight is already determined by the font family name.

**Wrong:**
```typescript
{
  fontFamily: getFontFamily('600'),
  fontWeight: '600', // ❌ Remove this!
}
```

**Correct:**
```typescript
{
  fontFamily: getFontFamily('600'), // ✅ Only this
}
```

## Alternative: Using Typography Utilities

For consistent styling, you can also use Typography utilities:

```typescript
import Typography from '../utils/typography';

const styles = StyleSheet.create({
  heading: {
    ...Typography.h1, // Bold, 32px
  },
  body: {
    ...Typography.body, // Regular, 16px
  },
  button: {
    ...Typography.button, // SemiBold, 16px
  },
  // Or combine:
  customText: {
    ...Typography.fontBold,
    ...Typography.textSize18,
  },
});
```

## Quick Fix Script Pattern

For each screen file, search for:
1. `fontWeight: 'XXX'` patterns
2. Replace with `fontFamily: getFontFamily('XXX')`
3. Remove the `fontWeight` line if it's on the same style object
4. Add import if missing: `import { getFontFamily } from '../utils/fonts';`

## Verification

After fixing, verify fonts are working by:
1. Rebuild the app: `npx react-native run-ios` or `npx react-native run-android`
2. Check that text renders with Metropolis fonts
3. Verify no console errors about missing fonts

## Notes

- All screens should use custom fonts for consistency
- The theme typography already uses `getFontFamily('200')` which is now correctly mapped to ExtraLight
- Some screens may use `theme.typography.body.fontFamily` which is fine, but ensure it's using the correct weight
- For dynamic fontWeight (e.g., `fontWeight: isSelected ? '600' : '400'`), use: `fontFamily: isSelected ? getFontFamily('600') : getFontFamily('400')`

