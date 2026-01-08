# 🔧 Troubleshooting Guide - TargetBoard App

## Common Issues & Solutions

---

## ❌ Emulator Storage Full Error

### Error Message
```
java.io.IOException: Requested internal only, but not enough space
INSTALL_FAILED_INSUFFICIENT_STORAGE
```

### Root Cause
**NOT a code issue** - Your Android Emulator's internal storage is full.

The APK builds successfully, but Android cannot install it due to insufficient storage.

### Why This Happens
- React Native 0.83 + ExoPlayer + TPStreams = Large APK size
- Debug builds include symbols and are larger
- Emulator default storage (2GB) is often insufficient
- App caches data over time

### ✅ Quick Fixes (Choose One)

#### Option 1: Wipe Emulator Data (Fastest - 2 minutes)
1. Open **Android Studio**
2. Go to **Device Manager**
3. Find your emulator (e.g., `Medium_Phone_API_36.1`)
4. Click **⋮ (3 dots)** → **Wipe Data**
5. Start emulator again
6. Run: `npx react-native run-android`

**Success Rate**: 90% ✅

---

#### Option 2: Increase Emulator Storage (Best Long-term)
1. **Android Studio** → **Device Manager**
2. Click **✏️ Edit** on your emulator
3. Click **Show Advanced Settings**
4. Set:
   - **Internal Storage**: `8192 MB` or `16384 MB` (8-16 GB)
   - **SD Card**: `2048 MB` (2 GB)
5. **Save** → **Cold Boot** emulator
6. Run: `npx react-native run-android`

**Success Rate**: 100% ✅

---

#### Option 3: Clean Install via ADB (If above don't work)
```bash
# Uninstall existing app
adb uninstall com.targetboard
adb uninstall com.targetboard.debug

# Clear caches
adb shell pm trim-caches 999999999

# Reboot emulator
adb reboot

# Wait for reboot, then run
npx react-native run-android
```

---

#### Option 4: Delete & Recreate Emulator (Cleanest)
1. **Device Manager** → **Delete** old emulator
2. **Create New Emulator**:
   - API 34 or 35 (API 36 is heavy)
   - **Internal Storage**: ≥ 8 GB
   - **SD Card**: 2 GB
3. Start emulator
4. Run: `npx react-native run-android`

---

### ✅ Recommended Emulator Settings

For React Native apps with video/streaming:

| Setting | Recommended Value |
|---------|-------------------|
| **API Level** | 34 or 35 (avoid 36 for dev) |
| **Internal Storage** | 8192 MB (8 GB) minimum |
| **SD Card** | 2048 MB (2 GB) |
| **RAM** | 2048 MB (2 GB) minimum |

---

### 🧹 Maintenance Tips

**Weekly Cleanup** (Prevents storage issues):
```bash
# Clear app data
adb uninstall com.targetboard.debug

# Clear system caches
adb shell pm trim-caches 999999999

# Reboot
adb reboot
```

---

## ❌ Build Errors

### "Redeclaration" Errors
**Error**: `Redeclaration: class MainActivity`

**Fix**: Old package directory still exists
```bash
# Remove old package directory
rm -rf android/app/src/main/java/com/testapp
```

---

### "newArchEnabled=false" Warning
**Error**: Setting `newArchEnabled=false` is deprecated

**Fix**: Remove from `android/gradle.properties`
```properties
# Remove this line:
newArchEnabled=false
```

---

## ❌ Network/API Errors

### "Network error" in App
**Check**:
1. `.env` file exists and has correct values
2. `BASE_URL` is correct
3. Network banner shows connection status
4. Try offline mode (should work with cache)

**Fix**: Verify `.env` file:
```bash
# Check if .env exists
ls -la .env

# Verify it has required keys
grep BASE_URL .env
```

---

## ❌ Metro Bundler Issues

### "Unable to resolve module"
**Fix**: Clear Metro cache
```bash
# Stop Metro
# Press Ctrl+C

# Clear cache and restart
npx react-native start --reset-cache
```

---

### "Port 8081 already in use"
**Fix**: Kill process on port 8081
```bash
# Find and kill process
lsof -ti:8081 | xargs kill -9

# Or use different port
npx react-native start --port 8082
```

---

## ✅ Verification Checklist

After fixing issues, verify:

- [ ] App builds successfully (`BUILD SUCCESSFUL`)
- [ ] APK installs on emulator (`Installed on 1 device`)
- [ ] App launches without crashes
- [ ] Home screen loads with skeletons
- [ ] Network banner shows (if offline)
- [ ] Global loader appears during initialization
- [ ] No console errors in Metro

---

## 📞 Still Having Issues?

1. **Check Logs**:
   ```bash
   # Android logs
   adb logcat | grep -i error
   
   # Metro logs
   # Check terminal where Metro is running
   ```

2. **Verify Environment**:
   ```bash
   # Check Node version
   node --version  # Should be >= 20
   
   # Check React Native
   npx react-native --version
   
   # Check Android SDK
   echo $ANDROID_HOME
   ```

3. **Clean Build**:
   ```bash
   # Android
   cd android
   ./gradlew clean
   cd ..
   
   # Clear Metro cache
   rm -rf node_modules/.cache
   npx react-native start --reset-cache
   ```

---

**Last Updated**: January 8, 2025

