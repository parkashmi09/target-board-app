#!/bin/bash

# ADB Reverse Port Forwarding for All Connected Devices
# This script sets up port forwarding (8081) for all connected Android devices

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
  echo "Setting up reverse port forwarding for $DEVICE..."
  adb -s "$DEVICE" reverse tcp:8081 tcp:8081
  if [ $? -eq 0 ]; then
    echo "✅ Successfully set up reverse for $DEVICE"
  else
    echo "❌ Failed to set up reverse for $DEVICE"
  fi
done

echo ""
echo "✅ ADB reverse setup complete!"



