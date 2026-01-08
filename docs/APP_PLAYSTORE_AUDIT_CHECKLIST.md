# 📱 App Play Store Audit Checklist – TargetBoard

## App Overview
- App Name: Target Board
- App Type: Educational / Course Selling / Live Streaming
- Platform: Android (Google Play)
- Framework: React Native 0.83.1
- Current Version: 1.0
- Target SDK: 36 (Android 15)
- Payment Method: Razorpay (⚠️ NON-COMPLIANT)
- Live Streaming Provider: TPStreams

---

## 1. App Information Accuracy

- [x] App description matches actual features
- [x] No misleading claims (free, guaranteed results, #1, best)
- [ ] Screenshots reflect real UI (Cannot verify - need manual check)
- [x] Live streaming functionality clearly explained

Status:
- ✅ PASS (Pending screenshot verification)

Notes / Corrections Needed:
- App appears to accurately represent features (courses, live streaming, PDFs, videos)
- No obvious misleading claims found in codebase
- Ensure Play Store screenshots match actual UI

---

## 2. Google Play Payments Compliance

- [ ] Google Play Billing used for digital content
- [x] No external payment gateways for in-app digital unlocks
- [x] Pricing is transparent
- [ ] Refund policy available

Status:
- ❌ REQUIRED FIX (BLOCKING)

Risk Explanation:
**CRITICAL VIOLATION**: App uses Razorpay (external payment gateway) for digital course purchases. Google Play Policy requires ALL digital content purchases to use Google Play Billing. This will result in immediate rejection.

**Why it's risky:**
- Violates Google Play Billing Policy Section 3
- Apps selling digital content (courses, videos, PDFs) MUST use Google Play Billing
- External payment methods are only allowed for physical goods or services
- This is a top rejection reason for educational apps

Correction Required:
1. **IMMEDIATE**: Integrate Google Play Billing Library (com.android.billingclient:billing)
2. Replace Razorpay integration with Google Play Billing for course purchases
3. Keep Razorpay ONLY if selling physical books/products (not digital content)
4. Update payment flow to use `BillingClient` for purchases
5. Implement purchase verification through Google Play API
6. Add refund policy URL in Play Console

**Alternative**: If courses are considered "services" (live tutoring), you may need to restructure pricing model or get Google approval for alternative billing.

---

## 3. Privacy Policy & Data Safety

- [ ] Privacy Policy URL exists
- [ ] Data collected is clearly declared
- [ ] Data Safety form matches actual data usage
- [x] HTTPS enforced for all APIs
- [ ] Account deletion method available

Status:
- ❌ REQUIRED FIX

Missing / Incorrect Items:
1. **Privacy Policy URL**: Settings screen has placeholder but no actual URL/link
   - Location: `src/screens/SettingsScreen.tsx:176-179`
   - Fix: Add WebView or external link to privacy policy

2. **Account Deletion**: No account deletion functionality found
   - Required by Google Play Policy (User Data Policy)
   - Must provide way for users to delete their account and data
   - Fix: Add account deletion API endpoint and UI in Settings

3. **Data Safety Form**: Need to verify Play Console Data Safety section matches:
   - Personal info collected: Name, Email, Phone (via OTP)
   - Location data: City (optional)
   - App activity: Course purchases, video watch history
   - Device/IDs: Token stored in AsyncStorage

4. **Data Collection Declaration**: Ensure Play Console accurately lists:
   - Authentication data (phone, OTP)
   - Profile data (name, city, class, board)
   - Purchase history
   - Video viewing data
   - Chat messages (if stored)

**Good**: All API calls use HTTPS (`https://seashell-app-3z5jp.ondigitalocean.app`)

---

## 4. User-Generated Content & Live Streaming

- [ ] Moderation policy documented
- [ ] Report / block mechanism exists
- [ ] Content rules defined
- [x] Stream access limited to enrolled users

Status:
- ❌ REQUIRED FIX

Moderation Gaps:
1. **No Report/Block Features**: Live chat (`src/components/LiveChat/index.tsx`) has no report or block functionality
   - Users can send messages but cannot report abusive content
   - No moderation UI visible in chat interface
   - Fix: Add report message button and block user functionality

2. **No Moderation Policy**: No visible terms/rules for chat behavior
   - Fix: Add chat rules modal on first chat use
   - Document moderation policy in Play Store listing

3. **Content Moderation**: No evidence of:
   - Automated content filtering
   - Admin moderation tools
   - Message deletion by moderators (backend may have this, but not visible in app)

4. **Stream Access Control**: ✅ Good - Streams check `isUserPurchased` flag before allowing access

**Required Actions:**
- Add report button to chat messages
- Add block user functionality
- Display chat rules/community guidelines
- Link to moderation policy in Play Store

---

## 5. Permissions Audit

- [x] Camera used only for live classes (Not used in app - TPStreams handles it)
- [x] Microphone usage justified (Not used in app - TPStreams handles it)
- [x] Storage access minimal
- [x] No restricted permissions requested unnecessarily

Status:
- ✅ PASS

Permissions to Remove / Justify:
**AndroidManifest.xml Analysis:**
- ✅ Only `INTERNET` permission declared (minimal and justified)
- ✅ Runtime permissions requested appropriately:
  - `READ_MEDIA_IMAGES` (Android 13+) for QR code download
  - `WRITE_EXTERNAL_STORAGE` (Android < 13) for PDF downloads
- ✅ Permissions requested only when needed (not on app launch)
- ✅ Permission rationale provided to users

**iOS Info.plist:**
- ⚠️ `NSLocationWhenInUseUsageDescription` is empty string
  - Fix: Remove if not using location, or add proper description

**No issues found** - Permissions are minimal and justified.

---

## 6. Security & Networking

- [ ] No hardcoded secrets
- [x] Tokens handled securely
- [ ] Razorpay / Billing keys not exposed
- [x] Socket connections secured

Status:
- ❌ REQUIRED FIX (CRITICAL)

Security Risks Identified:
1. **HARDCODED RAZORPAY KEYS** (CRITICAL):
   - Location: `src/services/config.ts:7-8`
   - Exposed: `RAZORPAY_KEY_ID = 'rzp_live_RtWhnAHfAgJxzC'`
   - Exposed: `RAZORPAY_KEY_SECRET = 'F4mvOpH0CH9PotBo8OrWjcUx'`
   - **Risk**: Anyone can extract keys from APK and misuse them
   - **Fix**: Move to environment variables or secure backend API

2. **HARDCODED TPSTREAMS ACCESS TOKEN** (HIGH):
   - Location: `src/screens/StreamPlayerScreen.tsx:19`
   - Exposed: `ACCESS_TOKEN = 'eb608abc-0b42-4dc4-b161-fe6512b996a8'`
   - **Risk**: Token can be extracted and used to access streams
   - **Fix**: Fetch token from backend API with user authentication

3. **HARDCODED API BASE URL** (MEDIUM):
   - Location: `src/services/config.ts:1-3`
   - URLs are hardcoded but this is acceptable for API endpoints
   - Consider using environment-based config for dev/staging/prod

**Good Security Practices Found:**
- ✅ Tokens stored in AsyncStorage (encrypted on device)
- ✅ Bearer token authentication used
- ✅ HTTPS enforced for all API calls
- ✅ Socket connections use HTTPS (`https://test-app-api-vbu7.onrender.com/`)

**Required Actions:**
1. **IMMEDIATE**: Rotate Razorpay keys (current ones are compromised)
2. Move all secrets to backend API or environment variables
3. Never commit secrets to version control
4. Use react-native-config or similar for environment variables

---

## 7. Code Quality (High-Level)

- [x] Dependency versions stable
- [x] No unused libraries
- [x] Clear separation of concerns
- [x] Error handling implemented
- [ ] No console logs in production

Status:
- ⚠️ NEEDS IMPROVEMENT

Refactoring Needed:
1. **Console Logs in Production** (188 instances found):
   - Many `console.log`, `console.error`, `console.warn` statements
   - Most are wrapped in `__DEV__` checks (good), but some are not
   - **Fix**: 
     - Remove all non-`__DEV__` console statements
     - Use a logging library that auto-disables in production
     - Example: `src/services/api.ts:573-574` has console.log without `__DEV__`

2. **Dependency Versions**: ✅ Good
   - React Native 0.83.1 (stable)
   - Dependencies use caret (^) for minor updates (safe)
   - No obvious deprecated packages

3. **Code Structure**: ✅ Good
   - Clear separation: services, screens, components, store
   - TypeScript used for type safety
   - Zustand for state management (lightweight)

4. **Error Handling**: ✅ Good
   - Try-catch blocks used appropriately
   - API errors handled with custom ApiError class
   - User-friendly error messages

**Required Actions:**
- Remove or wrap all console.log statements in `__DEV__` checks
- Consider using a production logging service (Sentry, etc.)

---

## 8. Performance & Stability

- [ ] App launch time acceptable (Cannot verify - needs testing)
- [ ] No crashes on cold start (Cannot verify - needs testing)
- [x] Orientation handling stable
- [x] Live stream does not auto-play audio

Status:
- ⚠️ NEEDS IMPROVEMENT (Needs manual testing)

Performance Issues:
1. **Orientation Handling**: ✅ Good
   - `react-native-orientation-locker` included
   - AndroidManifest handles orientation changes
   - Video player supports landscape

2. **Stream Auto-play**: ✅ Good
   - No evidence of auto-playing audio
   - User must manually start streams

3. **Potential Issues** (Need Testing):
   - Large number of dependencies may impact startup time
   - Image loading without optimization visible
   - No code splitting or lazy loading visible

**Recommendations:**
- Test app launch time on low-end devices
- Monitor crash reports in Play Console
- Consider implementing React.lazy for screen components
- Optimize image loading with caching

---

## 9. Play Store Listing Quality

- [ ] Title & descriptions compliant (Cannot verify - needs Play Console check)
- [ ] No policy-violating keywords (Cannot verify - needs Play Console check)
- [ ] Contact details provided (Cannot verify - needs Play Console check)
- [ ] Support email active (Cannot verify - needs manual check)

Status:
- ⚠️ NEEDS IMPROVEMENT (Requires Play Console review)

Listing Corrections:
**Cannot audit from codebase - requires Play Console access**

**Checklist for Play Console:**
1. App title: Must be ≤ 50 characters, no misleading terms
2. Short description: ≤ 80 characters, clear value proposition
3. Full description: 
   - Clearly explain features (courses, live streaming, PDFs)
   - Mention target audience (9th-12th board students)
   - No spam keywords or excessive capitalization
4. Contact email: Must be active and monitored
5. Privacy Policy URL: Must be accessible and complete
6. Screenshots: Must show actual app UI (not mockups)
7. Feature graphic: High quality, represents app accurately

**Common Violations to Avoid:**
- ❌ "Best", "#1", "Guaranteed results"
- ❌ Fake reviews or ratings
- ❌ Misleading screenshots
- ❌ Incomplete contact information

---

# 🚨 FINAL RISK SUMMARY

## P0 – BLOCKING (Must fix before submission)
- [x] **Replace Razorpay with Google Play Billing** - App will be rejected without this
- [x] **Remove hardcoded Razorpay keys** - Security risk, keys are exposed
- [x] **Add Privacy Policy URL** - Required by Google Play Policy
- [x] **Implement Account Deletion** - Required by User Data Policy
- [x] **Add Chat Moderation Features** - Report/block functionality for UGC

## P1 – IMPORTANT (Should fix)
- [x] **Remove hardcoded TPStreams access token** - Move to backend API
- [x] **Clean up console.log statements** - Remove production logs (188 instances)
- [x] **Fix iOS location permission description** - Empty string in Info.plist
- [x] **Add chat moderation policy** - Document rules and moderation process
- [x] **Verify Play Store listing** - Check title, description, screenshots compliance

## P2 – NICE TO HAVE
- [x] **Performance optimization** - Test launch time, implement lazy loading
- [x] **Error tracking** - Consider Sentry or similar for production monitoring
- [x] **Code splitting** - Lazy load screens for better performance
- [x] **Image optimization** - Implement caching and compression

---

## Auditor Notes
Date: January 8, 2025
Reviewer: AI Audit (Auto)
Overall Readiness Score: **3 / 10**

### Summary
The app has **5 critical blocking issues** that will prevent Play Store approval:
1. Payment method violation (Razorpay instead of Google Play Billing)
2. Exposed API keys and secrets
3. Missing privacy policy implementation
4. No account deletion feature
5. Missing chat moderation tools

### Estimated Fix Time
- **P0 Issues**: 2-3 weeks (Google Play Billing integration is complex)
- **P1 Issues**: 1 week
- **P2 Issues**: 1-2 weeks

### Next Steps
1. **IMMEDIATE**: Rotate all exposed API keys (Razorpay, TPStreams)
2. Start Google Play Billing integration (this is the longest task)
3. Implement privacy policy URL and account deletion
4. Add chat moderation features
5. Clean up code and test thoroughly
6. Re-audit before submission

### Risk Assessment
- **Current Risk Level**: 🔴 **CRITICAL** - Will be rejected
- **After P0 Fixes**: 🟡 **MEDIUM** - Should pass review
- **After All Fixes**: 🟢 **LOW** - Production ready

