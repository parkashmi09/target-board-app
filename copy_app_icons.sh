#!/bin/bash

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Copying iOS app icons..."
# Copy all iOS PNG icons
SOURCE_IOS="$SCRIPT_DIR/icons/AppIcons/Assets.xcassets/AppIcon.appiconset"
TARGET_IOS="$SCRIPT_DIR/ios/TestApp/Images.xcassets/AppIcon.appiconset"

if [ -d "$SOURCE_IOS" ]; then
    for file in "$SOURCE_IOS"/*.png; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            cp "$file" "$TARGET_IOS/$filename"
            echo "  Copied: $filename"
        fi
    done
    echo "✅ iOS icons copied successfully!"
else
    echo "❌ iOS icons source directory not found: $SOURCE_IOS"
fi

echo ""
echo "Copying Android app icons..."
# Copy Android icons
SOURCE_ANDROID="$SCRIPT_DIR/icons/AppIcons/android"
TARGET_ANDROID="$SCRIPT_DIR/android/app/src/main/res"

if [ -d "$SOURCE_ANDROID" ]; then
    for density in mipmap-hdpi mipmap-mdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi; do
        if [ -f "$SOURCE_ANDROID/$density/ic_launcher.png" ]; then
            cp "$SOURCE_ANDROID/$density/ic_launcher.png" "$TARGET_ANDROID/$density/ic_launcher.png"
            # Also copy as round launcher if it doesn't exist
            if [ ! -f "$TARGET_ANDROID/$density/ic_launcher_round.png" ]; then
                cp "$SOURCE_ANDROID/$density/ic_launcher.png" "$TARGET_ANDROID/$density/ic_launcher_round.png"
            fi
            echo "  Copied: $density/ic_launcher.png"
        fi
    done
    echo "✅ Android icons copied successfully!"
else
    echo "❌ Android icons source directory not found: $SOURCE_ANDROID"
fi

echo ""
echo "✅ All app icons copied successfully!"
echo ""
echo "iOS icons location: ios/TestApp/Images.xcassets/AppIcon.appiconset/"
echo "Android icons location: android/app/src/main/res/mipmap-*/"

