#!/bin/bash

# ADB Free Space - Free up storage on Android device/emulator
# This script helps resolve INSTALL_FAILED_INSUFFICIENT_STORAGE errors

PACKAGE_NAME="com.targetboard"

echo "🔍 Checking connected devices..."
DEVICES=$(adb devices | grep -w "device" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
  echo "❌ No devices found. Please connect a device or start an emulator."
  exit 1
fi

echo "Found devices:"
echo "$DEVICES"
echo ""

for DEVICE in $DEVICES; do
  echo "📱 Processing device: $DEVICE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Check available storage
  echo "📊 Checking available storage..."
  adb -s "$DEVICE" shell df -h /data 2>/dev/null | tail -1 || echo "Could not check storage"
  echo ""
  
  # Uninstall the app
  echo "🗑️  Uninstalling $PACKAGE_NAME..."
  adb -s "$DEVICE" uninstall "$PACKAGE_NAME" 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "✅ Successfully uninstalled from $DEVICE"
  else
    echo "ℹ️  App not installed on $DEVICE (or already removed)"
  fi
  
  # Clear app data if app still exists
  echo "🧹 Clearing app data and cache..."
  adb -s "$DEVICE" shell pm clear "$PACKAGE_NAME" 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "✅ Cleared app data"
  else
    echo "ℹ️  Could not clear app data (app may not exist)"
  fi
  
  # Clear Android cache partition (requires root on physical devices)
  echo "🧹 Attempting to clear cache partition..."
  adb -s "$DEVICE" shell "su -c 'rm -rf /cache/*'" 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "✅ Cleared cache partition"
  else
    echo "ℹ️  Could not clear cache (may require root or not available on emulator)"
  fi
  
  # Clear dalvik cache (for emulators)
  echo "🧹 Clearing dalvik cache..."
  adb -s "$DEVICE" shell "su -c 'rm -rf /data/dalvik-cache/*'" 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "✅ Cleared dalvik cache"
  else
    echo "ℹ️  Could not clear dalvik cache (may require root)"
  fi
  
  # Check storage again
  echo ""
  echo "📊 Storage after cleanup:"
  adb -s "$DEVICE" shell df -h /data 2>/dev/null | tail -1 || echo "Could not check storage"
  
  echo ""
done

echo ""
echo "✅ Cleanup complete! You can now try installing again:"
echo "   npm run android"
echo ""
echo "💡 If the issue persists, try:"
echo "   1. Free up more space on your device/emulator"
echo "   2. Increase emulator storage in AVD settings"
echo "   3. Delete unused apps from the device"
