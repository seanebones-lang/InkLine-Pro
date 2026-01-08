# App Flow Testing Guide

## Pre-Build Testing Checklist

### 1. Authentication Flow
- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Sign out functionality
- [ ] Session persistence after app restart

### 2. Subscription Flow
- [ ] View paywall when accessing premium features
- [ ] Purchase subscription (test mode)
- [ ] Restore purchases
- [ ] Subscription status updates correctly

### 3. Generate Screen
- [ ] Image picker (camera/gallery) works
- [ ] Text input accepts description
- [ ] Generate button triggers AI pipeline
- [ ] Progress indicators show during generation
- [ ] Generated design displays correctly
- [ ] SVG preview with dot/dash patterns renders
- [ ] Design saves to history automatically

### 4. Print Functionality
- [ ] Print button appears after generation
- [ ] WiFi/AirPrint option works
- [ ] Bluetooth scanning (Android) works
- [ ] Bluetooth device selection works
- [ ] Share option works
- [ ] PNG export at 300 DPI works

### 5. History Screen
- [ ] Generations load from Supabase
- [ ] Offline mode works (local SQLite)
- [ ] Search functionality works
- [ ] Pagination works (load more)
- [ ] Pull to refresh syncs data
- [ ] Delete generation works
- [ ] Share generation works
- [ ] Thumbnails load correctly

### 6. Performance
- [ ] List scrolling is smooth (60fps)
- [ ] Animations are smooth
- [ ] No memory leaks during navigation
- [ ] Images load efficiently
- [ ] Search is responsive

### 7. Dark Mode
- [ ] Theme switches correctly
- [ ] All screens support dark mode
- [ ] Colors are readable in both modes
- [ ] Theme preference persists

### 8. Accessibility
- [ ] Screen readers work correctly
- [ ] All interactive elements have labels
- [ ] Touch targets are adequate size
- [ ] Text is readable
- [ ] Color contrast meets WCAG standards

### 9. Offline Sync
- [ ] Generations save locally when offline
- [ ] Sync to Supabase when online
- [ ] No data loss during sync
- [ ] Conflict resolution works

### 10. Error Handling
- [ ] Network errors handled gracefully
- [ ] API errors show user-friendly messages
- [ ] App doesn't crash on errors
- [ ] Loading states show during async operations

## EAS Build Preparation

### Before Building:
1. Update version in `app.json`
2. Set correct bundle identifiers
3. Configure environment variables
4. Test on physical devices
5. Run full test suite

### Build Commands:
```bash
# Development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview build
eas build --profile preview --platform ios
eas build --profile preview --platform android

# Production build
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Environment Variables:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `GROK_API_KEY` (server-side only)

## Known Issues to Test:
- Bluetooth printing only works on Android
- Large images may need optimization
- Offline sync may have race conditions with rapid saves
