#!/bin/bash
# Fix generated ReactNativeApplicationEntryPoint.java file
# This script fixes the package name in the generated file

GENERATED_FILE="app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java"

if [ -f "$GENERATED_FILE" ]; then
    sed -i '' 's/com\.targetboard/co.targetboardboardprep/g' "$GENERATED_FILE"
    echo "✅ Fixed generated file: $GENERATED_FILE"
else
    echo "⚠️  Generated file not found: $GENERATED_FILE"
fi
