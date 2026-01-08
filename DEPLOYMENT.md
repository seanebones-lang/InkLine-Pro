# Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] App Store checklist completed
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Version number updated in `app.json`
- [ ] Build number incremented
- [ ] Environment variables configured
- [ ] API keys secured (not in code)

## EAS Build Setup

### Install EAS CLI
```bash
npm install -g eas-cli
```

### Login to Expo
```bash
eas login
```

### Configure Project
```bash
eas build:configure
```

## Build Commands

### Development Build
```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android

# Both
eas build --profile development --platform all
```

### Preview Build (Internal Testing)
```bash
# iOS
eas build --profile preview --platform ios

# Android
eas build --profile preview --platform android

# Both
eas build --profile preview --platform all
```

### Production Build
```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android

# Both
eas build --profile production --platform all
```

## Environment Variables

Set environment variables in EAS:

```bash
# Set variables
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"

# List variables
eas secret:list

# Delete variable
eas secret:delete --name VARIABLE_NAME
```

## iOS Specific

### App Store Connect Setup
1. Create app in App Store Connect
2. Configure app information
3. Set up subscriptions
4. Upload screenshots and metadata
5. Submit for review

### Required Information
- App name
- Subtitle
- Description
- Keywords
- Screenshots (various sizes)
- App preview video (optional)
- Privacy Policy URL
- Support URL
- Marketing URL (optional)

### Entitlements
Ensure these are configured in `app.json`:
- In-App Purchase
- Push Notifications (if applicable)
- Associated Domains (if applicable)

## Android Specific

### Google Play Console Setup
1. Create app in Play Console
2. Configure app information
3. Set up subscriptions
4. Upload screenshots and metadata
5. Submit for review

### Required Information
- App title
- Short description
- Full description
- Screenshots (various sizes)
- Feature graphic
- App icon
- Privacy Policy URL
- Support email

### Permissions
Review permissions in `app.json`:
- Camera
- Photo Library
- Bluetooth
- Location (for Bluetooth)

## Build Profiles

### Development
- For internal testing
- Includes development client
- Debug mode enabled
- Can use simulator (iOS)

### Preview
- For internal distribution
- Production-like build
- Can be distributed via TestFlight/Internal Testing
- No simulator support

### Production
- For App Store/Play Store
- Optimized build
- Production environment
- Signed with distribution certificates

## Submitting to Stores

### iOS (App Store)
```bash
# Build and submit
eas build --profile production --platform ios --auto-submit

# Or build first, then submit
eas build --profile production --platform ios
eas submit --platform ios
```

### Android (Google Play)
```bash
# Build and submit
eas build --profile production --platform android --auto-submit

# Or build first, then submit
eas build --profile production --platform android
eas submit --platform android
```

## Testing Before Submission

### TestFlight (iOS)
1. Build preview/production build
2. Upload to TestFlight
3. Invite testers
4. Collect feedback
5. Fix issues
6. Submit to App Store

### Internal Testing (Android)
1. Build preview/production build
2. Upload to Play Console
3. Create internal testing track
4. Invite testers
5. Collect feedback
6. Fix issues
7. Submit to production

## Post-Deployment

### Monitor
- [ ] App Store/Play Console analytics
- [ ] Crash reports
- [ ] User reviews
- [ ] Revenue/subscription metrics
- [ ] API usage
- [ ] Error logs

### Updates
- [ ] Plan update schedule
- [ ] Monitor user feedback
- [ ] Fix critical bugs quickly
- [ ] Regular feature updates

## Rollback Plan

If issues are discovered after release:

1. **Immediate Actions**
   - Identify the issue
   - Assess impact
   - Decide on rollback

2. **Rollback Process**
   - Revert to previous version
   - Notify users (if critical)
   - Fix issue in development
   - Test thoroughly
   - Release hotfix

3. **Communication**
   - Update release notes
   - Communicate with users (if needed)
   - Document the issue

## Version Management

### Semantic Versioning
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

### Example
```
1.0.0 -> 1.0.1 (patch)
1.0.1 -> 1.1.0 (minor)
1.1.0 -> 2.0.0 (major)
```

### Update Version
1. Update `version` in `app.json`
2. EAS will auto-increment build number
3. Or manually set build number

## Troubleshooting

### Build Fails
- Check EAS build logs
- Verify environment variables
- Check code for errors
- Verify certificates/credentials

### Submission Fails
- Check store requirements
- Verify metadata
- Check compliance checklist
- Review store guidelines

### App Rejected
- Read rejection reason
- Fix issues
- Resubmit with explanation
- Contact store support if needed

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Expo Deployment Guide](https://docs.expo.dev/distribution/introduction/)
