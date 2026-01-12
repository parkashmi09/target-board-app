# 🔧 Android Studio Node.js Error - Simple Fix

## ❌ Problem
Android Studio sync में error:
```
A problem occurred starting process 'command 'node''
Cannot run program "node": error=2, No such file or directory
```

## ✅ Quick Fix (2 Steps)

### STEP 1: Android Studio में Environment Variables Set करें

1. **Android Studio खोलें**
2. **Preferences** (Mac: `Cmd + ,` | Windows: `Ctrl + ,`)
3. **Build, Execution, Deployment → Build Tools → Gradle**
4. **Gradle JVM:** Select your JDK
5. Scroll down to **Environment variables**
6. Click **+** (Add)
7. Add:
   ```
   Name: PATH
   Value: /Users/dev_miku/.nvm/versions/node/v24.6.0/bin:$PATH
   ```
8. Click **OK**
9. Click **Apply** → **OK**

### STEP 2: Android Studio Restart करें

1. **File → Invalidate Caches**
2. Select: **Invalidate and Restart**
3. Wait for restart

---

## ✅ Alternative: Terminal से Launch करें

अगर ऊपर वाला काम न करे:

```bash
# Terminal खोलें
export PATH=/Users/dev_miku/.nvm/versions/node/v24.6.0/bin:$PATH
nvm use 24.6.0

# Android Studio launch करें
open -a "Android Studio"
```

---

## ✅ Verification

Android Studio में:
1. **File → Sync Project with Gradle Files**
2. अगर sync successful हो → ✅ Fixed!

---

## 🚨 अगर अभी भी Error आए

### Additional Fix:

**Gradle Daemon Stop करें:**
```bash
cd android
./gradlew --stop
```

फिर Android Studio में फिर से sync करें।

---

**Status: Node.js v24.6.0 configured** ✅
