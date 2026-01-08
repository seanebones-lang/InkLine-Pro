# App Store & Google Play Compliance Checklist

## Privacy & Data Protection

### GDPR Compliance (EU)
- [ ] Privacy Policy URL included in app metadata
- [ ] User consent for data collection (if applicable)
- [ ] Right to access personal data
- [ ] Right to delete personal data
- [ ] Data processing transparency
- [ ] Cookie consent (if web version exists)
- [ ] Data breach notification procedures

### CCPA Compliance (California)
- [ ] Privacy Policy includes CCPA disclosures
- [ ] "Do Not Sell My Personal Information" option (if applicable)
- [ ] Consumer rights disclosure
- [ ] Opt-out mechanisms

### General Privacy
- [ ] Privacy Policy is accessible and comprehensive
- [ ] Data collection clearly disclosed
- [ ] Third-party services disclosed (Supabase, RevenueCat, xAI Grok)
- [ ] No collection of sensitive data without consent
- [ ] Data retention policies stated
- [ ] International data transfers disclosed

## Subscription Compliance

### App Store (iOS)
- [ ] Subscription terms clearly displayed
- [ ] Auto-renewal clearly disclosed
- [ ] Subscription management accessible
- [ ] Restore purchases functionality works
- [ ] Free trial terms (if applicable) clearly stated
- [ ] Subscription pricing matches App Store listing
- [ ] Receipt validation implemented
- [ ] Subscription status synced correctly
- [ ] Grace period handling (if applicable)
- [ ] Promotional offers configured (if applicable)

### Google Play (Android)
- [ ] Subscription terms clearly displayed
- [ ] Auto-renewal clearly disclosed
- [ ] Subscription management accessible
- [ ] Restore purchases functionality works
- [ ] Free trial terms (if applicable) clearly stated
- [ ] Subscription pricing matches Play Console listing
- [ ] Purchase acknowledgment implemented
- [ ] Subscription status synced correctly
- [ ] Grace period handling (if applicable)
- [ ] Promotional offers configured (if applicable)

### RevenueCat Specific
- [ ] RevenueCat SDK properly integrated
- [ ] Webhook configured for server-side validation
- [ ] Subscription status synced with Supabase
- [ ] Entitlements properly configured
- [ ] Test purchases work in sandbox
- [ ] Subscription restoration works

## Content & Functionality

### App Store Guidelines
- [ ] No misleading functionality
- [ ] All features work as described
- [ ] No placeholder content
- [ ] App doesn't crash on launch
- [ ] App doesn't crash during normal use
- [ ] All links work correctly
- [ ] No broken functionality
- [ ] App size is reasonable
- [ ] App loads within reasonable time

### Google Play Guidelines
- [ ] App follows Material Design principles
- [ ] App works on minimum supported Android version
- [ ] App works on various screen sizes
- [ ] App handles permissions gracefully
- [ ] App doesn't request unnecessary permissions
- [ ] App works offline (where applicable)

## AI & White-Labeling

### AI Disclosure (if required)
- [ ] AI usage disclosed in Privacy Policy
- [ ] AI limitations clearly stated
- [ ] User understands AI-generated content
- [ ] No false claims about AI capabilities

### White-Labeling
- [ ] No xAI/Grok branding visible to users
- [ ] No Hugging Face branding visible to users
- [ ] All API responses white-labeled
- [ ] Error messages don't expose third-party services
- [ ] Terms of Service don't mention third-party APIs

## Technical Requirements

### iOS
- [ ] App supports iOS 18.0+ (optimized for iOS 26)
- [ ] App works on iPhone and iPad
- [ ] App supports all required device orientations
- [ ] App handles different screen sizes
- [ ] App doesn't use deprecated APIs
- [ ] App passes App Store review guidelines
- [ ] App doesn't access private APIs
- [ ] App handles network errors gracefully
- [ ] App requests permissions appropriately

### Android
- [ ] App supports Android 14.0+ (API 34+, optimized for Android 15+)
- [ ] App works on various Android devices
- [ ] App supports different screen densities
- [ ] App handles different Android versions
- [ ] App doesn't use deprecated APIs
- [ ] App passes Google Play review guidelines
- [ ] App handles network errors gracefully
- [ ] App requests permissions appropriately

## Security

### Data Security
- [ ] API keys stored securely (not in client code)
- [ ] User authentication implemented
- [ ] Sensitive data encrypted
- [ ] HTTPS used for all network requests
- [ ] No hardcoded credentials
- [ ] Secure storage for tokens

### Code Security
- [ ] No exposed API keys in source code
- [ ] No debug code in production build
- [ ] Error messages don't expose sensitive info
- [ ] Input validation implemented
- [ ] SQL injection prevention (if applicable)

## Metadata & Store Listings

### App Store
- [ ] App name is appropriate
- [ ] Subtitle is descriptive
- [ ] Description is clear and accurate
- [ ] Keywords are relevant
- [ ] Screenshots show actual app functionality
- [ ] App preview video (if applicable) is accurate
- [ ] App icon meets requirements
- [ ] Support URL is valid
- [ ] Marketing URL is valid (if applicable)
- [ ] Privacy Policy URL is valid

### Google Play
- [ ] App title is appropriate
- [ ] Short description is clear
- [ ] Full description is comprehensive
- [ ] Screenshots show actual app functionality
- [ ] Feature graphic meets requirements
- [ ] App icon meets requirements
- [ ] Support email is valid
- [ ] Privacy Policy URL is valid

## Testing

### Pre-Submission Testing
- [ ] Test on physical devices (iOS)
- [ ] Test on physical devices (Android)
- [ ] Test on different screen sizes
- [ ] Test on different OS versions
- [ ] Test subscription flow end-to-end
- [ ] Test restore purchases
- [ ] Test offline functionality
- [ ] Test error handling
- [ ] Test edge cases
- [ ] Performance testing completed

### Test Accounts
- [ ] Test account credentials provided (if required)
- [ ] Test subscription account configured
- [ ] Demo mode available (if applicable)

## Legal

### Required Documents
- [ ] Privacy Policy published and accessible
- [ ] Terms of Service published and accessible
- [ ] End User License Agreement (if applicable)
- [ ] Data Processing Agreement (if applicable)
- [ ] Business information accurate

### Compliance
- [ ] Age rating appropriate
- [ ] Content rating accurate
- [ ] Export compliance (if applicable)
- [ ] COPPA compliance (if applicable)

## Final Checks

- [ ] All checkboxes above are completed
- [ ] App reviewed by legal team (if applicable)
- [ ] App reviewed by security team (if applicable)
- [ ] Beta testing completed
- [ ] User feedback incorporated
- [ ] App Store/Play Console accounts verified
- [ ] Banking/tax information complete
- [ ] Ready for submission

## Notes
- Keep this checklist updated as requirements change
- Review before each app update submission
- Document any exceptions or special cases
