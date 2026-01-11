#!/bin/bash

# ADB Clean Install - Uninstall app from all devices to free up space
# This script uninstalls the app from all connected devices before installation

PACKAGE_NAME="com.targetboard"

echo "Checking connected devices..."
DEVICES=$(adb devices | grep -w "device" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
  echo "❌ No devices found. Please connect a device or start an emulator."
  exit 1
fi

echo "Found devices:"
echo "$DEVICES"
echo ""

for DEVICE in $DEVICES; do
  echo "Uninstalling $PACKAGE_NAME from $DEVICE..."
  adb -s "$DEVICE" uninstall "$PACKAGE_NAME" 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "✅ Successfully uninstalled from $DEVICE"
  else
    echo "ℹ️  App not installed on $DEVICE (or already removed)"
  fi
done

echo ""
echo "✅ Cleanup complete! You can now run: npm run android"



