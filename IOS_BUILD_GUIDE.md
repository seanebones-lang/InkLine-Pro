# iOS Build Guide - Complete Reference

**Platform:** iOS (iPhone & iPad)  
**Last Updated:** January 2026  
**Expo SDK:** 54  
**React Native:** 0.79.0  
**Minimum iOS:** 18.0 (Optimized for iOS 26)

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

1. **macOS** (required for iOS development)
   - macOS 12.0 or later
   - Xcode 15.0 or later
   - Command Line Tools

2. **Xcode**
   ```bash
   # Install via App Store or:
   xcode-select --install
   ```

3. **Node.js & npm**
   ```bash
   # Verify installation
   node --version  # Should be 20.x or later (LTS)
   npm --version
   ```

4. **Expo CLI**
   ```bash
   npm install -g expo-cli eas-cli
   ```

5. **CocoaPods** (for native dependencies)
   ```bash
   sudo gem install cocoapods
   ```

6. **Apple Developer Account**
   - Active Apple Developer Program membership ($99/year)
   - Access to App Store Connect
   - Certificates and provisioning profiles

### Required Accounts

- **Apple Developer Account** - For signing and distribution
- **Expo Account** - For EAS Build
- **GitHub Account** - For repository access

---

## Branching Strategy

### Creating iOS-Specific Branch

```bash
# 1. Ensure you're on main/develop and up to date
git checkout main
git pull origin main

# 2. Create iOS-specific feature branch
git checkout -b ios/feature-name
# or
git checkout -b ios/fix/bug-description

# 3. For iOS-specific builds
git checkout -b ios/build/preview
git checkout -b ios/build/production
```

### Branch Naming Conventions

- `ios/feature/feature-name` - iOS-specific features
- `ios/fix/bug-description` - iOS bug fixes
- `ios/build/preview` - Preview build branch
- `ios/build/production` - Production build branch
- `ios/test/integration` - iOS integration testing

### Working with iOS Branch

```bash
# Make iOS-specific changes
# Update app.json iOS configuration
# Update native iOS code if needed

# Commit changes
git add .
git commit -m "feat(ios): add iOS-specific feature"

# Push to remote
git push origin ios/feature-name

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

# Install iOS pods (if using bare workflow)
cd ios
pod install
cd ..
```

### 2. Configure Environment Variables

Create `.env` file (if not exists):

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_ios_revenuecat_key
```

### 3. Configure app.json for iOS

Verify iOS configuration in `app.json`:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.inklinepro.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "This app needs access to camera to take photos for printing.",
        "NSPhotoLibraryUsageDescription": "This app needs access to photo library to select images for printing.",
        "NSBluetoothPeripheralUsageDescription": "This app uses Bluetooth to connect to ESC/POS printers.",
        "NSLocationWhenInUseUsageDescription": "This app needs access to location for Bluetooth device discovery."
      }
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
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "simulator": false
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

---

## Building for Testing

### Option 1: Development Build (Recommended for Testing)

#### Step 1: Create Development Build

```bash
# Build for iOS simulator (fastest for testing)
eas build --profile development --platform ios --local

# Or build on EAS servers
eas build --profile development --platform ios
```

#### Step 2: Install on Simulator

```bash
# List available simulators
xcrun simctl list devices

# Install build on simulator
# Download .tar.gz from EAS, then:
tar -xzf build-*.tar.gz
xcrun simctl install booted build.app
xcrun simctl launch booted com.inklinepro.app
```

#### Step 3: Install on Physical Device

```bash
# For physical device testing:
# 1. Build with development profile
eas build --profile development --platform ios

# 2. Download .ipa file
# 3. Install via:
#    - Xcode (Window > Devices and Simulators)
#    - Apple Configurator 2
#    - TestFlight (see Archive section)
```

### Option 2: Preview Build (Internal Testing)

#### Step 1: Create Preview Build

```bash
# Build preview version
eas build --profile preview --platform ios

# This creates an .ipa file for internal distribution
```

#### Step 2: Distribute via TestFlight

```bash
# After build completes, submit to TestFlight
eas submit --platform ios

# Or manually:
# 1. Download .ipa from EAS
# 2. Upload to App Store Connect
# 3. Process in TestFlight
```

#### Step 3: Install via TestFlight

1. Add testers in App Store Connect
2. Testers receive email invitation
3. Install TestFlight app
4. Accept invitation and install app

### Option 3: Local Development

```bash
# Start Expo development server
npm start

# Press 'i' to open iOS simulator
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
    "ios": {
      "buildNumber": "1"  // Increment for each build
    }
  }
}
```

**Version Format:**
- `version`: Semantic version (e.g., "1.0.0")
- `buildNumber`: Incremental number (e.g., "1", "2", "3")

### Step 2: Create Production Build

```bash
# Build for App Store
eas build --profile production --platform ios

# This will:
# - Auto-increment build number
# - Create production-signed .ipa
# - Upload to EAS servers
```

### Step 3: Submit to App Store

#### Option A: EAS Submit (Recommended)

```bash
# Submit directly to App Store Connect
eas submit --platform ios

# Follow prompts to:
# - Select build
# - Enter App Store Connect credentials
# - Submit for review
```

#### Option B: Manual Submission

1. **Download Build**
   ```bash
   # Download .ipa from EAS dashboard
   # Or use:
   eas build:list
   eas build:download [build-id]
   ```

2. **Upload via Transporter**
   - Open Transporter app (from App Store)
   - Drag .ipa file
   - Click "Deliver"
   - Wait for processing

3. **Submit via App Store Connect**
   - Go to App Store Connect
   - Select your app
   - Create new version
   - Select build
   - Fill in release notes
   - Submit for review

### Step 4: Archive Management

```bash
# List all builds
eas build:list --platform ios

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

#### Issue: "No provisioning profile found"

**Solution:**
```bash
# 1. Verify Apple Developer account
eas build:configure

# 2. Check credentials
eas credentials

# 3. Regenerate credentials if needed
eas credentials --platform ios
```

#### Issue: "Code signing error"

**Solution:**
```bash
# 1. Check certificates
eas credentials --platform ios

# 2. Revoke and regenerate
eas credentials --platform ios --clear-all
eas build:configure
```

#### Issue: "Bundle identifier conflict"

**Solution:**
1. Check `app.json` bundle identifier
2. Verify it matches App Store Connect
3. Ensure it's unique

#### Issue: "Build timeout"

**Solution:**
```bash
# Use local builds for faster iteration
eas build --profile development --platform ios --local

# Or increase timeout in eas.json
```

### Simulator Issues

#### Issue: "Simulator won't launch"

**Solution:**
```bash
# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all

# Or reset specific simulator
xcrun simctl erase "iPhone 15 Pro"
```

#### Issue: "App crashes on launch"

**Solution:**
```bash
# Check logs
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "InkLinePro"'

# Or in Xcode:
# Window > Devices and Simulators > View Device Logs
```

### Device Issues

#### Issue: "App won't install on device"

**Solution:**
1. Check device UDID is registered
2. Verify provisioning profile includes device
3. Check device trust settings
4. Rebuild with correct profile

#### Issue: "Untrusted developer"

**Solution:**
1. Settings > General > VPN & Device Management
2. Tap developer app
3. Tap "Trust"

### Dependency Issues

#### Issue: "Pod install fails"

**Solution:**
```bash
# Clean and reinstall
cd ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod install
cd ..
```

#### Issue: "Native module not found"

**Solution:**
```bash
# Rebuild native modules
cd ios
pod install
cd ..
npm start -- --reset-cache
```

### Network Issues

#### Issue: "EAS build fails to start"

**Solution:**
```bash
# Check EAS status
eas whoami

# Verify network connection
ping expo.io

# Try again
eas build --profile development --platform ios
```

---

## FAQ

### Q: How long does a build take?

**A:** 
- **Development build:** 10-15 minutes (EAS) or 5-10 minutes (local)
- **Preview build:** 15-20 minutes
- **Production build:** 20-30 minutes

### Q: Can I build without Apple Developer account?

**A:** No. Apple Developer account ($99/year) is required for:
- Code signing
- App Store distribution
- TestFlight
- Device testing

### Q: How do I test on a physical device?

**A:** 
1. Register device UDID in Apple Developer portal
2. Build with development profile
3. Install via Xcode or TestFlight

### Q: What's the difference between development and production builds?

**A:**
- **Development:** For testing, includes dev tools, faster builds
- **Production:** For App Store, optimized, signed for distribution

### Q: How do I update the build number?

**A:**
```json
// In app.json
{
  "expo": {
    "ios": {
      "buildNumber": "2"  // Increment this
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

### Q: Can I build for both simulator and device?

**A:** Yes, but you need separate builds:
```bash
# Simulator build
eas build --profile development --platform ios --local

# Device build
eas build --profile development --platform ios
```

### Q: How do I debug production builds?

**A:**
1. Enable crash reporting (Sentry, etc.)
2. Check device logs in Xcode
3. Use TestFlight crash reports
4. Enable verbose logging in production

### Q: What if my build is rejected by App Store?

**A:**
1. Check rejection reason in App Store Connect
2. Fix issues (usually in rejection email)
3. Resubmit with updated build
4. Common issues: missing privacy descriptions, crashes, guidelines violations

### Q: How do I rollback to a previous version?

**A:**
1. Download previous build from EAS
2. Submit previous build to App Store Connect
3. Or create new build with previous code:
   ```bash
   git checkout [previous-commit]
   eas build --profile production --platform ios
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
      "ios": {
        "bundleIdentifier": "com.inklinepro.app.staging"
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
eas build:list --platform ios

# View specific build
eas build:view [build-id]

# Or check EAS dashboard
# https://expo.dev/accounts/[account]/projects/[project]/builds
```

### Q: What's the maximum build size?

**A:**
- **App Store limit:** 4GB (but recommended <200MB)
- **Over-the-air limit:** 100MB (for updates)
- **Current bundle:** Check with `npm run analyze:bundle`

### Q: How do I reduce build size?

**A:**
1. Optimize images (use WebP, compress)
2. Remove unused dependencies
3. Enable code splitting
4. Use Hermes engine (enabled by default)
5. Analyze bundle: `npm run analyze:bundle`

### Q: Can I build without EAS?

**A:** Yes, but requires:
1. Xcode project (run `npx expo prebuild`)
2. Manual code signing setup
3. Xcode Archive process
4. Manual App Store submission

**Not recommended** - EAS is much simpler.

---

## Best Practices

### Version Management

1. **Semantic Versioning**
   - Major.Minor.Patch (e.g., 1.2.3)
   - Increment based on changes

2. **Build Number**
   - Always increment for App Store
   - Use auto-increment in production

3. **Git Tags**
   ```bash
   git tag -a v1.0.0 -m "Release 1.0.0"
   git push origin v1.0.0
   ```

### Build Optimization

1. **Use Local Builds for Development**
   ```bash
   eas build --profile development --platform ios --local
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

2. **Preview Builds**
   - Use for internal testing
   - TestFlight distribution

3. **Production Builds**
   - Use for App Store submission
   - Final testing before release

### Security

1. **Never commit secrets**
   - Use environment variables
   - Use EAS secrets for sensitive data

2. **Code Signing**
   - Let EAS manage certificates
   - Don't share private keys

3. **App Transport Security**
   - Ensure HTTPS for all APIs
   - Configure ATS exceptions if needed

### Monitoring

1. **Track Build Times**
   - Monitor EAS dashboard
   - Optimize slow builds

2. **Monitor Crashes**
   - Use TestFlight crash reports
   - Integrate Sentry for production

3. **Performance Metrics**
   - Use Xcode Instruments
   - Monitor memory usage

---

## Quick Reference Commands

```bash
# Development
npm start                    # Start dev server
eas build --profile development --platform ios --local

# Preview
eas build --profile preview --platform ios
eas submit --platform ios

# Production
eas build --profile production --platform ios
eas submit --platform ios

# Management
eas build:list --platform ios
eas build:view [build-id]
eas build:download [build-id]
eas credentials --platform ios

# Troubleshooting
eas build:configure
npm start -- --reset-cache
cd ios && pod install && cd ..
```

---

## Additional Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Apple Developer Portal](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [React Native iOS Guide](https://reactnative.dev/docs/running-on-device)

---

**Last Updated:** January 2026  
**Maintained by:** InkLine Pro Development Team
