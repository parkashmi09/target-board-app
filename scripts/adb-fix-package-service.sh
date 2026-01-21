#!/bin/bash

# ADB Fix Package Service Error
# This script fixes the "Can't find service: package" error by restarting ADB and device services

echo "🔧 Fixing ADB Package Service Error..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Check connected devices
echo "📱 Step 1: Checking connected devices..."
DEVICES=$(adb devices | grep -w "device" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
  echo "❌ No devices found. Please connect a device or start an emulator."
  exit 1
fi

echo "✅ Found devices:"
echo "$DEVICES"
echo ""

# Step 2: Restart ADB server
echo "🔄 Step 2: Restarting ADB server..."
adb kill-server
sleep 2
adb start-server
sleep 2
echo "✅ ADB server restarted"
echo ""

# Step 3: Verify device connection
echo "🔍 Step 3: Verifying device connection..."
for DEVICE in $DEVICES; do
  echo "Checking device: $DEVICE"
  adb -s "$DEVICE" get-state
  if [ $? -eq 0 ]; then
    echo "✅ Device $DEVICE is connected"
  else
    echo "❌ Device $DEVICE connection failed"
  fi
done
echo ""

# Step 4: Restart package manager service on device
echo "🔄 Step 4: Restarting package manager service on device(s)..."
for DEVICE in $DEVICES; do
  echo "Processing device: $DEVICE"
  
  # Try to restart the package manager service
  echo "  → Attempting to restart package manager..."
  adb -s "$DEVICE" shell "stop" 2>/dev/null
  sleep 1
  adb -s "$DEVICE" shell "start" 2>/dev/null
  sleep 2
  
  # Alternative: Kill and restart system_server (requires root on some devices)
  echo "  → Attempting to restart system services..."
  adb -s "$DEVICE" shell "su -c 'killall system_server'" 2>/dev/null || \
  adb -s "$DEVICE" shell "killall system_server" 2>/dev/null || \
  echo "  ℹ️  Could not restart system_server (may require root or emulator restart)"
  
  sleep 2
done
echo ""

# Step 5: Verify package service is available
echo "🔍 Step 5: Verifying package service availability..."
for DEVICE in $DEVICES; do
  echo "Testing device: $DEVICE"
  RESULT=$(adb -s "$DEVICE" shell "service list | grep package" 2>/dev/null)
  if [ -n "$RESULT" ]; then
    echo "✅ Package service is available on $DEVICE"
  else
    echo "⚠️  Package service check failed (this may be normal on some devices)"
  fi
done
echo ""

# Step 6: Test basic ADB commands
echo "🧪 Step 6: Testing basic ADB commands..."
for DEVICE in $DEVICES; do
  echo "Testing device: $DEVICE"
  adb -s "$DEVICE" shell "pm list packages | head -5" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ Package manager commands work on $DEVICE"
  else
    echo "❌ Package manager commands failed on $DEVICE"
    echo "   → Try restarting the emulator/device manually"
  fi
done
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ADB fix complete!"
echo ""
echo "📝 Next steps:"
echo "   1. If the issue persists, try restarting your emulator/device"
echo "   2. Run: npm run android"
echo "   3. If still failing, try: adb kill-server && adb start-server"
echo ""
