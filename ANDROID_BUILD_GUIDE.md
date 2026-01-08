# Android Build Guide - Complete Reference

**Platform:** Android  
**Last Updated:** January 2026  
**Expo SDK:** 52  
**React Native:** 0.77.0  
**Minimum SDK:** 26 (Android 8.0)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Branching Strategy](#branching-strategy)
3. [Environment Setup](#environment-setup)
4. [Building for Testing](#building-for-testing)
5. [Building for Archive/Production](#building-for-archiveproduction)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)
8. [Best Practices](#best-practices)

---

## Prerequisites

### Required Software

1. **Operating System**
   - macOS, Linux, or Windows
   - 8GB RAM minimum (16GB recommended)
   - 10GB free disk space

2. **Java Development Kit (JDK)**
   ```bash
   # Install JDK 17 (required for React Native 0.77)
   # macOS (using Homebrew)
   brew install openjdk@17
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install openjdk-17-jdk
   
   # Verify installation
   java -version  # Should show 17.x
   ```

3. **Android Studio**
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Install Android SDK (API 33+ recommended)
   - Install Android SDK Build-Tools
   - Install Android Emulator

4. **Android SDK Components**
   ```bash
   # Via Android Studio SDK Manager:
   # - Android SDK Platform 33
   # - Android SDK Build-Tools 33.0.0
   # - Android Emulator
   # - Android SDK Platform-Tools
   # - Google Play services
   ```

5. **Environment Variables**
   ```bash
   # Add to ~/.bashrc, ~/.zshrc, or ~/.profile
   export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
   # export ANDROID_HOME=$HOME/Android/Sdk  # Linux
   # export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows
   
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   
   # Reload shell
   source ~/.zshrc  # or ~/.bashrc
   ```

6. **Node.js & npm**
   ```bash
   node --version  # Should be 18.x or later
   npm --version
   ```

7. **Expo CLI**
   ```bash
   npm install -g expo-cli eas-cli
   ```

8. **Google Play Developer Account**
   - One-time $25 registration fee
   - Access to Google Play Console
   - App signing key management

### Required Accounts

- **Google Play Developer Account** - For distribution
- **Expo Account** - For EAS Build
- **GitHub Account** - For repository access

---

## Branching Strategy

### Creating Android-Specific Branch

```bash
# 1. Ensure you're on main/develop and up to date
git checkout main
git pull origin main

# 2. Create Android-specific feature branch
git checkout -b android/feature-name
# or
git checkout -b android/fix/bug-description

# 3. For Android-specific builds
git checkout -b android/build/preview
git checkout -b android/build/production
```

### Branch Naming Conventions

- `android/feature/feature-name` - Android-specific features
- `android/fix/bug-description` - Android bug fixes
- `android/build/preview` - Preview build branch
- `android/build/production` - Production build branch
- `android/test/integration` - Android integration testing

### Working with Android Branch

```bash
# Make Android-specific changes
# Update app.json Android configuration
# Update native Android code if needed
# Update gradle files if needed

# Commit changes
git add .
git commit -m "feat(android): add Android-specific feature"

# Push to remote
git push origin android/feature-name

# Create PR to main/develop
```

---

## Environment Setup

### 1. Install Dependencies

```bash
# Navigate to project root
cd /path/to/InkLine-Pro

# Install npm dependencies
npm install
```

### 2. Configure Environment Variables

Create `.env` file (if not exists):

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_android_revenuecat_key
```

### 3. Configure app.json for Android

Verify Android configuration in `app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.inklinepro.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

### 4. EAS Configuration

Verify `eas.json`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

### 5. Login to EAS

```bash
# Login to Expo
eas login

# Configure project
eas build:configure
```

### 6. Generate Keystore (First Time Only)

```bash
# EAS will generate and manage keystore automatically
# Or generate manually:
eas credentials --platform android

# Follow prompts to generate keystore
```

---

## Building for Testing

### Option 1: Development Build (Recommended for Testing)

#### Step 1: Create Development Build

```bash
# Build APK for testing (faster, installable directly)
eas build --profile development --platform android --local

# Or build on EAS servers
eas build --profile development --platform android
```

#### Step 2: Install on Emulator

```bash
# Start Android emulator
emulator -avd Pixel_5_API_33  # Use your AVD name

# Install APK
adb install path/to/app.apk

# Or drag and drop APK into emulator
```

#### Step 3: Install on Physical Device

**Via ADB:**
```bash
# Enable USB debugging on device
# Settings > About Phone > Tap Build Number 7 times
# Settings > Developer Options > Enable USB Debugging

# Connect device via USB
adb devices  # Verify device is connected

# Install APK
adb install path/to/app.apk
```

**Via File Transfer:**
1. Transfer APK to device
2. Open file manager on device
3. Tap APK file
4. Allow installation from unknown sources (if needed)
5. Install

### Option 2: Preview Build (Internal Testing)

#### Step 1: Create Preview Build

```bash
# Build preview APK
eas build --profile preview --platform android

# This creates an APK file for internal distribution
```

#### Step 2: Distribute via Internal Testing

**Option A: Google Play Internal Testing**
```bash
# After build completes, submit to Play Console
eas submit --platform android

# Or manually:
# 1. Download APK from EAS
# 2. Upload to Google Play Console > Internal Testing
# 3. Add testers
```

**Option B: Direct APK Distribution**
1. Download APK from EAS
2. Share via email, file sharing, or QR code
3. Testers install directly

### Option 3: Local Development

```bash
# Start Expo development server
npm start

# Press 'a' to open Android emulator
# Or scan QR code with Expo Go app (limited features)
```

---

## Building for Archive/Production

### Step 1: Update Version

Update `app.json`:

```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1  // Increment for each build
    }
  }
}
```

**Version Format:**
- `version`: Semantic version (e.g., "1.0.0")
- `versionCode`: Incremental integer (e.g., 1, 2, 3)

**Important:** `versionCode` must always increase for Google Play.

### Step 2: Create Production Build

```bash
# Build AAB (Android App Bundle) for Play Store
eas build --profile production --platform android

# This will:
# - Auto-increment versionCode
# - Create production-signed AAB
# - Upload to EAS servers
```

### Step 3: Submit to Google Play

#### Option A: EAS Submit (Recommended)

```bash
# Submit directly to Google Play Console
eas submit --platform android

# Follow prompts to:
# - Select build
# - Enter Google Play credentials
# - Select track (internal/testing/production)
# - Submit for review
```

#### Option B: Manual Submission

1. **Download Build**
   ```bash
   # Download AAB from EAS dashboard
   # Or use:
   eas build:list --platform android
   eas build:download [build-id]
   ```

2. **Upload via Play Console**
   - Go to [Google Play Console](https://play.google.com/console)
   - Select your app
   - Go to Production (or Testing track)
   - Click "Create new release"
   - Upload AAB file
   - Fill in release notes
   - Review and roll out

### Step 4: Archive Management

```bash
# List all builds
eas build:list --platform android

# View build details
eas build:view [build-id]

# Download specific build
eas build:download [build-id]

# Cancel build
eas build:cancel [build-id]
```

---

## Troubleshooting

### Build Failures

#### Issue: "Gradle build failed"

**Solution:**
```bash
# 1. Clean gradle cache
cd android
./gradlew clean
cd ..

# 2. Clear Expo cache
npm start -- --reset-cache

# 3. Rebuild
eas build --profile development --platform android --local
```

#### Issue: "Keystore not found"

**Solution:**
```bash
# Generate new keystore
eas credentials --platform android

# Or use existing keystore
eas credentials --platform android --use-existing
```

#### Issue: "Package name conflict"

**Solution:**
1. Check `app.json` package name
2. Verify it matches Google Play Console
3. Ensure it's unique (reverse domain format)

#### Issue: "Build timeout"

**Solution:**
```bash
# Use local builds for faster iteration
eas build --profile development --platform android --local

# Or increase timeout in eas.json
```

#### Issue: "SDK version mismatch"

**Solution:**
```bash
# Update Android SDK
# Android Studio > SDK Manager > Update SDK Platform

# Or specify in app.json:
{
  "expo": {
    "android": {
      "compileSdkVersion": 33,
      "targetSdkVersion": 33,
      "minSdkVersion": 26
    }
  }
}
```

### Emulator Issues

#### Issue: "Emulator won't start"

**Solution:**
```bash
# List available AVDs
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_5_API_33

# Or via Android Studio:
# Tools > Device Manager > Start emulator
```

#### Issue: "HAXM not installed" (Intel Macs)

**Solution:**
```bash
# Install HAXM
# Download from: https://github.com/intel/haxm/releases
# Or via Android Studio SDK Manager
```

#### Issue: "App crashes on launch"

**Solution:**
```bash
# Check logs
adb logcat | grep -i "inklinepro"

# Or filter by tag
adb logcat *:E  # Errors only
adb logcat ReactNativeJS:V *:S  # React Native logs
```

### Device Issues

#### Issue: "Device not recognized"

**Solution:**
```bash
# Check USB connection
adb devices

# If device shows "unauthorized":
# 1. Check device for "Allow USB debugging" prompt
# 2. Check "Always allow from this computer"
# 3. Revoke USB debugging authorizations on device
# 4. Reconnect and authorize

# Install drivers (Windows)
# Download from device manufacturer website
```

#### Issue: "Installation failed: INSTALL_FAILED_INSUFFICIENT_STORAGE"

**Solution:**
1. Free up space on device
2. Uninstall previous version
3. Clear app data
4. Try again

#### Issue: "App won't install: INSTALL_PARSE_FAILED_NO_CERTIFICATES"

**Solution:**
```bash
# Rebuild with proper signing
eas build --profile production --platform android

# Or check keystore
eas credentials --platform android
```

### Dependency Issues

#### Issue: "Gradle sync failed"

**Solution:**
```bash
# Clean gradle
cd android
./gradlew clean
rm -rf .gradle
cd ..

# Rebuild
eas build --profile development --platform android --local
```

#### Issue: "Native module not found"

**Solution:**
```bash
# Rebuild native modules
npm start -- --reset-cache

# Or prebuild
npx expo prebuild --platform android --clean
```

#### Issue: "Metro bundler errors"

**Solution:**
```bash
# Clear Metro cache
npm start -- --reset-cache

# Clear watchman (if installed)
watchman watch-del-all

# Clear node modules
rm -rf node_modules
npm install
```

### Network Issues

#### Issue: "EAS build fails to start"

**Solution:**
```bash
# Check EAS status
eas whoami

# Verify network connection
ping expo.io

# Check firewall/proxy settings
# Try again
eas build --profile development --platform android
```

#### Issue: "Download dependencies failed"

**Solution:**
```bash
# Use local build
eas build --profile development --platform android --local

# Or check internet connection
# Verify proxy settings if behind corporate firewall
```

### Permission Issues

#### Issue: "Permission denied" errors

**Solution:**
1. Check `app.json` permissions
2. Verify AndroidManifest.xml (if using bare workflow)
3. Request permissions at runtime:
   ```typescript
   import { PermissionsAndroid } from 'react-native';
   
   const granted = await PermissionsAndroid.request(
     PermissionsAndroid.PERMISSIONS.CAMERA
   );
   ```

---

## FAQ

### Q: How long does a build take?

**A:** 
- **Development build:** 10-15 minutes (EAS) or 5-10 minutes (local)
- **Preview build:** 15-20 minutes
- **Production build:** 20-30 minutes

### Q: Can I build without Google Play account?

**A:** Yes, for testing. But Google Play Developer account ($25 one-time) is required for:
- Google Play Store distribution
- Internal/closed testing tracks
- Production releases

### Q: What's the difference between APK and AAB?

**A:**
- **APK:** Direct install file, larger size, for testing
- **AAB:** Google Play format, optimized, smaller downloads, required for Play Store

### Q: How do I test on a physical device?

**A:** 
1. Enable USB debugging on device
2. Connect via USB
3. Run `adb devices` to verify
4. Install APK via `adb install` or drag-and-drop

### Q: What's the difference between development and production builds?

**A:**
- **Development:** For testing, includes dev tools, faster builds, APK format
- **Production:** For Play Store, optimized, AAB format, signed for distribution

### Q: How do I update the version code?

**A:**
```json
// In app.json
{
  "expo": {
    "android": {
      "versionCode": 2  // Increment this (must always increase)
    }
  }
}
```

Or use auto-increment in `eas.json`:
```json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

### Q: Can I build for both debug and release?

**A:** Yes:
```bash
# Debug build
eas build --profile development --platform android

# Release build
eas build --profile production --platform android
```

### Q: How do I debug production builds?

**A:**
1. Enable crash reporting (Sentry, Firebase Crashlytics)
2. Check logs: `adb logcat`
3. Use Google Play Console crash reports
4. Enable verbose logging in production

### Q: What if my build is rejected by Google Play?

**A:**
1. Check rejection reason in Play Console
2. Fix issues (usually in rejection email)
3. Resubmit with updated build
4. Common issues: policy violations, crashes, missing permissions

### Q: How do I rollback to a previous version?

**A:**
1. Download previous build from EAS
2. Upload previous AAB to Play Console
3. Or create new build with previous code:
   ```bash
   git checkout [previous-commit]
   eas build --profile production --platform android
   ```

### Q: Can I build multiple variants (staging, production)?

**A:** Yes, create multiple profiles in `eas.json`:
```json
{
  "build": {
    "staging": {
      "env": {
        "ENVIRONMENT": "staging"
      },
      "android": {
        "package": "com.inklinepro.app.staging"
      }
    },
    "production": {
      "env": {
        "ENVIRONMENT": "production"
      }
    }
  }
}
```

### Q: How do I check build status?

**A:**
```bash
# List all builds
eas build:list --platform android

# View specific build
eas build:view [build-id]

# Or check EAS dashboard
# https://expo.dev/accounts/[account]/projects/[project]/builds
```

### Q: What's the maximum build size?

**A:**
- **Google Play limit:** 150MB for APK, 2GB for AAB expansion files
- **Recommended:** <100MB for faster downloads
- **Current bundle:** Check with `npm run analyze:bundle`

### Q: How do I reduce build size?

**A:**
1. Optimize images (use WebP, compress)
2. Remove unused dependencies
3. Enable ProGuard/R8 (automatic with AAB)
4. Use code splitting
5. Analyze bundle: `npm run analyze:bundle`

### Q: Can I build without EAS?

**A:** Yes, but requires:
1. Android Studio setup
2. Gradle configuration
3. Manual signing setup
4. Manual Play Console upload

**Not recommended** - EAS is much simpler.

### Q: How do I handle different screen sizes?

**A:**
- React Native handles this automatically
- Test on different emulators:
  ```bash
  # Small phone
  emulator -avd Pixel_4_API_33
  
  # Large phone
  emulator -avd Pixel_7_Pro_API_33
  
  # Tablet
  emulator -avd Pixel_Tablet_API_33
  ```

### Q: What Android versions are supported?

**A:**
- **Minimum:** Android 8.0 (API 26)
- **Target:** Android 13+ (API 33+)
- **Test on:** Multiple versions for compatibility

---

## Best Practices

### Version Management

1. **Semantic Versioning**
   - Major.Minor.Patch (e.g., 1.2.3)
   - Increment based on changes

2. **Version Code**
   - Always increment for Google Play
   - Use auto-increment in production
   - Never decrease version code

3. **Git Tags**
   ```bash
   git tag -a v1.0.0 -m "Release 1.0.0"
   git push origin v1.0.0
   ```

### Build Optimization

1. **Use Local Builds for Development**
   ```bash
   eas build --profile development --platform android --local
   ```

2. **Cache Dependencies**
   - EAS automatically caches
   - Local builds cache in `~/.expo`

3. **Parallel Builds**
   - Build iOS and Android separately
   - Use different machines if possible

### Testing Strategy

1. **Development Builds**
   - Use for feature development
   - Fast iteration
   - APK format for easy installation

2. **Preview Builds**
   - Use for internal testing
   - Internal testing track in Play Console

3. **Production Builds**
   - Use for Play Store submission
   - Final testing before release
   - AAB format required

### Security

1. **Never commit keystore**
   - Let EAS manage keystore
   - Store backup securely
   - Use different keystores for staging/production

2. **App Signing**
   - Use Google Play App Signing (recommended)
   - EAS manages upload key
   - Google manages app signing key

3. **Permissions**
   - Request at runtime
   - Explain why permissions are needed
   - Follow Android permission best practices

### Monitoring

1. **Track Build Times**
   - Monitor EAS dashboard
   - Optimize slow builds

2. **Monitor Crashes**
   - Use Google Play Console crash reports
   - Integrate Firebase Crashlytics
   - Monitor ANR (App Not Responding) reports

3. **Performance Metrics**
   - Use Android Profiler
   - Monitor memory usage
   - Track startup time

---

## Quick Reference Commands

```bash
# Development
npm start                    # Start dev server
eas build --profile development --platform android --local

# Preview
eas build --profile preview --platform android
eas submit --platform android

# Production
eas build --profile production --platform android
eas submit --platform android

# Management
eas build:list --platform android
eas build:view [build-id]
eas build:download [build-id]
eas credentials --platform android

# Device Management
adb devices                  # List connected devices
adb install app.apk         # Install APK
adb uninstall com.inklinepro.app  # Uninstall app
adb logcat                  # View logs
adb shell pm list packages  # List installed packages

# Troubleshooting
eas build:configure
npm start -- --reset-cache
cd android && ./gradlew clean && cd ..
```

---

## Additional Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Google Play Console](https://play.google.com/console)
- [Android Developer Guide](https://developer.android.com)
- [React Native Android Guide](https://reactnative.dev/docs/running-on-device)
- [Gradle Documentation](https://docs.gradle.org)

---

**Last Updated:** January 2026  
**Maintained by:** InkLine Pro Development Team
