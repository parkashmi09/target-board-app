# Firebase Push Notification Setup - Complete Checklist

## ✅ Setup Summary for Android (TargetBoard App)

This document contains all the steps completed for Firebase Cloud Messaging (FCM) setup.

---

## 📋 Step-by-Step Checklist

### 1️⃣ Firebase Console Setup
- [x] **Firebase Project Created**
  - Project ID: `target-board-app-42e83`
  - Project Number: `870462289984`
  
- [x] **Android App Added to Firebase**
  - Package Name: `com.targetboard` ✅
  - App Nickname: TargetBoard
  
- [x] **google-services.json Downloaded & Placed**
  - Location: `android/app/google-services.json` ✅
  - Package name verified: `com.targetboard` ✅

---

### 2️⃣ NPM Packages Installation
- [x] **Firebase Libraries Installed**
  - `@react-native-firebase/app`: ^23.7.0 ✅
  - `@react-native-firebase/messaging`: ^23.7.0 ✅
  - Location: `package.json` ✅

---

### 3️⃣ Android Configuration

#### A. Permissions (AndroidManifest.xml)
- [x] **POST_NOTIFICATIONS Permission Added**
  - File: `android/app/src/main/AndroidManifest.xml`
  - Line 4: `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />` ✅
  - Required for Android 13+ notifications

#### B. Gradle Configuration
- [x] **Google Services Plugin Added to Root build.gradle**
  - File: `android/build.gradle`
  - Line 18: `classpath("com.google.gms:google-services:4.4.2")` ✅

- [x] **Google Services Plugin Applied in App build.gradle**
  - File: `android/app/build.gradle`
  - Line 128: `apply plugin: 'com.google.gms.google-services'` ✅

---

### 4️⃣ Code Implementation

#### A. Background Message Handler (index.js)
- [x] **Background Handler Added**
  - File: `index.js`
  - Lines 7, 12-15: Background message handler at top level ✅
  - **CRITICAL**: Must be at top level for Android background notifications

```javascript
import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in background:', remoteMessage);
});
```

#### B. FCM Setup in App.tsx
- [x] **Firebase Messaging Import Added**
  - File: `App.tsx`
  - Line 11: `import messaging from '@react-native-firebase/messaging';` ✅

- [x] **Permission Request Handler**
  - Lines 64-89: Request notification permission ✅
  - Gets FCM token after permission granted ✅

- [x] **Foreground Notification Handler**
  - Lines 92-105: Handles notifications when app is open ✅
  - Shows Alert dialog for foreground notifications ✅

- [x] **Background Notification Handler**
  - Lines 108-114: Handles notifications when app is in background ✅
  - Logs notification data (ready for navigation) ✅

- [x] **Quit State Notification Handler**
  - Lines 117-126: Handles notifications when app is killed/quit ✅
  - Checks for initial notification on app launch ✅

---

## 🔍 Verification Checklist

### Files Modified/Created:
- [x] `package.json` - Firebase dependencies added
- [x] `android/app/src/main/AndroidManifest.xml` - POST_NOTIFICATIONS permission
- [x] `android/build.gradle` - Google Services classpath
- [x] `android/app/build.gradle` - Google Services plugin applied
- [x] `android/app/google-services.json` - Firebase config file
- [x] `index.js` - Background message handler
- [x] `App.tsx` - FCM setup and notification handlers

### Configuration Verified:
- [x] Package name matches: `com.targetboard`
- [x] google-services.json in correct location
- [x] All Gradle plugins properly configured
- [x] Background handler at top level (required for Android)

---

## 🚀 Next Steps (Optional Enhancements)

### 1. Send FCM Token to Backend
**Current Status**: Token is logged to console in dev mode

**To Implement**:
- Add API call to send token to your backend
- Location: `App.tsx` line 81-82 (TODO comment)
- Example:
```typescript
if (enabled) {
  const token = await messaging().getToken();
  // Send to backend
  await api.updateFCMToken(token);
}
```

### 2. Navigate on Notification Tap
**Current Status**: Notification data is logged

**To Implement**:
- Add navigation logic when notification is opened
- Location: `App.tsx` lines 112-113 and 124-125 (TODO comments)
- Example:
```typescript
messaging().onNotificationOpenedApp(remoteMessage => {
  const screen = remoteMessage.data?.screen || 'Home';
  navigation.navigate(screen);
});
```

### 3. Handle Token Refresh
**To Add**:
```typescript
useEffect(() => {
  const unsubscribe = messaging().onTokenRefresh(token => {
    console.log('FCM Token refreshed:', token);
    // Send new token to backend
    api.updateFCMToken(token);
  });
  return unsubscribe;
}, []);
```

### 4. Custom Notification Handling
- Custom notification sounds
- Custom notification icons
- Rich notifications with images
- Action buttons in notifications

---

## 🧪 Testing

### Build & Run
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Check Logs
```bash
# Watch Firebase logs
adb logcat | grep Firebase

# Watch FCM token generation
adb logcat | grep "FCM Token"
```

### Test Notification from Firebase Console
1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. Enter FCM token (from console logs)
4. Send notification
5. Verify it appears on device

---

## 📝 Backend Payload Format

Your backend should send notifications in this format:

```json
{
  "to": "FCM_TOKEN_HERE",
  "notification": {
    "title": "TargetBoard",
    "body": "New update available"
  },
  "data": {
    "type": "update",
    "screen": "Dashboard",
    "id": "123"
  }
}
```

**Important**:
- `notification` block → Shows system notification automatically
- `data` block → Custom data for app logic/navigation
- Sending only `data` → Won't show notification automatically

---

## ⚠️ Common Issues & Solutions

### Issue: "google-services.json is missing"
**Solution**: 
- Verify file is at `android/app/google-services.json`
- Run `./gradlew clean` and rebuild

### Issue: Notifications not showing on Android 13+
**Solution**: 
- Verify `POST_NOTIFICATIONS` permission in AndroidManifest.xml
- Check if user granted permission in app settings

### Issue: Background notifications not working
**Solution**: 
- Verify background handler is at top level in `index.js`
- Must be outside any component/function

### Issue: Token not generated
**Solution**: 
- Check if permission was granted
- Verify Firebase project setup
- Check console logs for errors

---

## ✅ Setup Complete!

All required steps have been completed. Your app is ready to receive Firebase push notifications on Android.

**Package Name**: `com.targetboard`  
**Firebase Project**: `target-board-app-42e83`  
**Status**: ✅ Ready for testing

---

*Last Updated: Firebase Push Notification Setup Complete*

