# Environment Variables Setup Guide

## Overview
This app uses `react-native-config` to manage environment variables securely. All sensitive keys and API endpoints are now stored in `.env` files instead of being hardcoded in source code.

## Files Created
- `.env.example` - Template file (committed to git)
- `.env` - Actual values (NOT committed, in .gitignore)

## Setup Instructions

### 1. Create Your .env File
Copy the example file and fill in your actual values:
```bash
cp .env.example .env
```

### 2. Update .env with Your Values
Edit `.env` and replace placeholder values with your actual:
- Razorpay keys (get from https://dashboard.razorpay.com/app/keys)
- TPStreams credentials (get from your TPStreams dashboard)
- API URLs (if different from defaults)

### 3. For Android
The `.env` file is automatically loaded. No additional setup needed.

### 4. For iOS
Run pod install after creating .env:
```bash
cd ios && pod install && cd ..
```

## ⚠️ IMPORTANT SECURITY NOTES

1. **NEVER commit `.env` file** - It's already in `.gitignore`
2. **Rotate all exposed keys immediately** - The previous hardcoded keys were exposed and should be considered compromised
3. **Use different keys for dev/staging/production** - Create separate .env files for each environment
4. **Share .env.example with team** - But never share actual .env values

## Rotating Exposed Keys

Since the following keys were hardcoded and exposed in git history:

### Razorpay Keys (CRITICAL - Rotate Immediately)
1. Go to https://dashboard.razorpay.com/app/keys
2. Generate new API keys
3. Update `.env` file with new keys
4. Update your backend to use new keys

### TPStreams Access Token (HIGH - Rotate Immediately)
1. Go to your TPStreams dashboard
2. Generate new access token
3. Update `.env` file with new token

## Troubleshooting

### Variables not loading?
- Make sure `.env` file exists in project root
- For Android: Clean and rebuild (`cd android && ./gradlew clean && cd ..`)
- For iOS: Run `pod install` in ios directory
- Restart Metro bundler

### Build errors?
- Check that all required variables are in `.env`
- Verify no syntax errors in `.env` file (no spaces around `=`)
- Make sure react-native-config is installed: `npm list react-native-config`

