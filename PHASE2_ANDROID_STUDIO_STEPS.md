# 🚀 PHASE 2: ANDROID STUDIO - AAB GENERATION

## 📌 IMPORTANT CONTEXT
- Package Name: `co.targetboardboardprep` ✅
- Google Play App Signing: **ON** ✅
- Current Play Store Version: 66
- New Version: 67 (67.0)
- **You can create a NEW keystore** (old one not needed)

---

## 🎯 STEP-BY-STEP INSTRUCTIONS

### ✅ STEP 1: Open Project in Android Studio

1. Open **Android Studio**
2. Click **File → Open**
3. Navigate to: `/Users/dev_miku/Developer/projects/tb/test-tb-app2.0/TestApp/android`
4. Click **OK**
5. Wait for Gradle sync to complete (bottom status bar)

---

### ✅ STEP 2: Generate Signed Bundle (AAB)

1. In Android Studio menu bar, click:
   **Build → Generate Signed Bundle / APK**

2. Dialog box opens:
   - Select: **Android App Bundle** ✅
   - Click **Next**

3. **Keystore Selection:**
   - Select: **Create new...** (since Play App Signing is ON, you can create new)
   - Click **Next**

4. **New Keystore Details:**
   Fill in the form:
   ```
   Key store path: [Choose location, e.g., android/app/release-key.jks]
   Password: [Create strong password - SAVE IT!]
   Confirm: [Re-enter password]
   
   Key:
   Alias: release-key
   Password: [Can be same as keystore password or different - SAVE IT!]
   Validity: 25 (years)
   Certificate:
   First and Last Name: [Your name]
   Organizational Unit: [Your company/org]
   Organization: [Your company]
   City: [Your city]
   State: [Your state]
   Country Code: IN (or your country)
   ```
   - Click **OK**

5. **Keystore Path Confirmation:**
   - Verify keystore path is correct
   - Enter **Key store password**
   - Enter **Key alias**: `release-key`
   - Enter **Key password**
   - ✅ Check: **Remember passwords** (optional but helpful)
   - Click **Next**

6. **Build Variants:**
   - Select: **release** ✅
   - Click **Finish**

7. **Wait for Build:**
   - Android Studio will build the AAB
   - Progress shown in **Build** tab at bottom
   - When complete, you'll see: **BUILD SUCCESSFUL**

---

### ✅ STEP 3: Locate Generated AAB

1. After build completes, Android Studio will show a notification:
   **"APK(s) generated successfully"**

2. Click **locate** in the notification, OR

3. Manually navigate to:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```

4. **File name:** `app-release.aab`
   - This is your **final AAB file** ready for Play Store upload

---

### ✅ STEP 4: Verify AAB (Optional but Recommended)

1. Check file size (should be reasonable, not too large)
2. Check file location: `android/app/build/outputs/bundle/release/`
3. File should be named: `app-release.aab`

---

## ⚠️ IMPORTANT NOTES

### 🔐 Keystore Security
- **SAVE your keystore file** (`release-key.jks`) in a safe place
- **SAVE passwords** in a secure password manager
- **DO NOT commit keystore to Git** (add to `.gitignore`)

### 📦 AAB File
- File size: Usually 10-50 MB (depends on your app)
- This is the **only file** you need for Play Store upload
- **DO NOT** upload APK, only AAB

### ✅ Pre-Upload Checklist
- [ ] AAB file generated successfully
- [ ] Keystore file saved securely
- [ ] Passwords saved securely
- [ ] Firebase `google-services.json` updated (if using Firebase)
- [ ] Version code is 67 (verified in build.gradle)

---

## 🚨 TROUBLESHOOTING

### ❌ Error: "Gradle sync failed"
**Solution:**
- File → Invalidate Caches → Invalidate and Restart
- Wait for Gradle sync again

### ❌ Error: "Build failed"
**Solution:**
- Check Build tab for specific error
- Common issues:
  - Missing dependencies
  - Firebase config issues
  - Version conflicts

### ❌ Error: "Keystore already exists"
**Solution:**
- Use existing keystore path
- Or choose different location

---

## 🎯 NEXT STEPS (After AAB Generation)

Once you have `app-release.aab`:

1. **Go to Google Play Console**
2. **Select your app:** `co.targetboardboardprep`
3. **Production → Create new release**
4. **Upload:** `app-release.aab`
5. **Fill release notes**
6. **Review → Rollout**

---

## ✅ PHASE 2 COMPLETE WHEN:

- ✅ AAB file generated: `app-release.aab`
- ✅ File location confirmed
- ✅ Ready for Play Store upload

---

**Status: Ready to proceed with AAB generation in Android Studio** 🚀
