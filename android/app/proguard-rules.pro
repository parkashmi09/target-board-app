# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# ============================================
# React Native Screens (CRITICAL - Prevents ScreenFragment crashes)
# ============================================
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.swmansion.rnscreens.ScreenFragment { *; }
-keep class com.swmansion.rnscreens.ScreenStackFragment { *; }
-keep class com.swmansion.rnscreens.ScreenStackHeaderConfig { *; }
-keep class com.swmansion.rnscreens.ScreenContainer { *; }
-keep class com.swmansion.rnscreens.Screen { *; }
-dontwarn com.swmansion.rnscreens.**

# ============================================
# React Native PDF (Prevents pdfiumandroid crashes)
# ============================================
-keep class io.legere.pdfiumandroid.** { *; }
-keep class io.legere.pdfiumandroid.util.** { *; }
-keep class io.legere.pdfiumandroid.util.ConfigKt { *; }
-dontwarn io.legere.pdfiumandroid.**

# Keep PDF native methods
-keepclassmembers class * {
    native <methods>;
}

# ============================================
# React Native Core
# ============================================
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}

# ============================================
# React Navigation
# ============================================
-keep class com.reactnavigation.** { *; }
-dontwarn com.reactnavigation.**

# ============================================
# React Native Gesture Handler
# ============================================
-keep class com.swmansion.gesturehandler.** { *; }
-dontwarn com.swmansion.gesturehandler.**

# ============================================
# React Native Reanimated
# ============================================
-keep class com.swmansion.reanimated.** { *; }
-dontwarn com.swmansion.reanimated.**
