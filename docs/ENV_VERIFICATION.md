# Environment Variables Verification

## ✅ Files Updated to Use .env

All the following files have been updated to read from `.env` using `react-native-config`:

### 1. `src/services/config.ts`
- ✅ `BASE_URL` - from `Config.BASE_URL`
- ✅ `UPLOAD_URL` - from `Config.UPLOAD_URL`
- ✅ `SOCKET_URL` - from `Config.SOCKET_URL`
- ✅ `RAZORPAY_KEY_ID` - from `Config.RAZORPAY_KEY_ID`
- ✅ `RAZORPAY_KEY_SECRET` - from `Config.RAZORPAY_KEY_SECRET`

### 2. `src/screens/StreamPlayerScreen.tsx`
- ✅ `ORG_ID` - from `Config.TPSTREAMS_ORG_ID`
- ✅ `ACCESS_TOKEN` - from `Config.TPSTREAMS_ACCESS_TOKEN`

### 3. `App.tsx`
- ✅ `TPSTREAMS_ORG_ID` - from `Config.TPSTREAMS_ORG_ID`

### 4. `src/screens/VideoPlayerScreen.tsx`
- ✅ `ORG_ID` - from `Config.TPSTREAMS_ORG_ID`

## 📝 .env File Structure

Your `.env` file should contain:
```
BASE_URL=https://seashell-app-3z5jp.ondigitalocean.app/api/v1
UPLOAD_URL=https://seashell-app-3z5jp.ondigitalocean.app/api/v1
SOCKET_URL=https://test-app-api-vbu7.onrender.com/
RAZORPAY_KEY_ID=rzp_live_RtWhnAHfAgJxzC
RAZORPAY_KEY_SECRET=F4mvOpH0CH9PotBo8OrWjcUx
TPSTREAMS_ORG_ID=kuepke
TPSTREAMS_ACCESS_TOKEN=eb608abc-0b42-4dc4-b161-fe6512b996a8
```

## ✅ Verification Checklist

- [x] `.env` file created in project root
- [x] `.env.example` template created
- [x] All hardcoded keys removed from source code
- [x] All components using `Config` from `react-native-config`
- [x] Android build.gradle configured for react-native-config
- [ ] iOS pod install (run after creating .env)
- [ ] Test app to verify keys are loading correctly

## 🧪 Testing

To verify environment variables are loading:

1. **Check in Dev Mode:**
   - Look for warnings in console if keys are missing
   - App should work normally if keys are present

2. **Test Payment:**
   - Try making a test payment to verify Razorpay keys work

3. **Test Streaming:**
   - Try playing a stream to verify TPStreams credentials work

## ⚠️ Next Steps

1. **Rotate all exposed keys immediately:**
   - Razorpay: https://dashboard.razorpay.com/app/keys
   - TPStreams: Your TPStreams dashboard

2. **Update .env with new keys** after rotation

3. **For iOS:** Run `cd ios && pod install && cd ..`

4. **Rebuild app** to pick up new environment variables

