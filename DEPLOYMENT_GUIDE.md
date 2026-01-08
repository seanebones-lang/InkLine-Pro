# Deployment Guide

**Version:** 1.0.0  
**Last Updated:** January 2026

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] No console statements (use logger)
- [ ] Security audit passed (`npm audit`)

### Configuration

- [ ] Environment variables set
- [ ] Supabase configured
- [ ] RevenueCat configured
- [ ] Edge functions deployed
- [ ] API keys secured

### Testing

- [ ] Manual testing completed
- [ ] Test coverage >95%
- [ ] E2E tests pass
- [ ] Performance testing done
- [ ] Security testing completed

---

## Environment Setup

### Required Environment Variables

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# RevenueCat
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your-ios-key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your-android-key

# Edge Function (Supabase Dashboard)
GROK_API_KEY=your-grok-api-key
ALLOWED_ORIGIN=https://your-app-domain.com
ENVIRONMENT=production
```

---

## Build Process

### 1. Preview Build

```bash
# iOS Preview
npm run build:preview:ios

# Android Preview
npm run build:preview:android

# Both Platforms
npm run build:preview:all
```

### 2. Production Build

```bash
# iOS Production
npm run build:production:ios

# Android Production
npm run build:production:android

# Both Platforms
npm run build:production:all
```

---

## Supabase Setup

### 1. Database Migrations

```bash
# Run migrations
supabase db push

# Verify migrations
supabase db diff
```

### 2. Edge Functions

```bash
# Deploy Grok proxy
supabase functions deploy grok-proxy

# Set secrets
supabase secrets set GROK_API_KEY=your-key
supabase secrets set ALLOWED_ORIGIN=https://your-domain.com
supabase secrets set ENVIRONMENT=production
```

### 3. Row Level Security

Verify RLS policies are enabled:
- `profiles` table
- `tattoo_generations` table
- `grok_usage_logs` table

---

## App Store Deployment

### iOS (App Store)

1. **Prepare for Submission**
   - Update version in `app.json`
   - Update build number
   - Prepare screenshots
   - Write release notes

2. **Build**
   ```bash
   npm run build:production:ios
   ```

3. **Submit**
   - Use EAS Submit or Xcode
   - Complete App Store Connect forms
   - Submit for review

### Android (Google Play)

1. **Prepare for Submission**
   - Update version in `app.json`
   - Update version code
   - Prepare screenshots
   - Write release notes

2. **Build**
   ```bash
   npm run build:production:android
   ```

3. **Submit**
   - Use EAS Submit or Play Console
   - Complete store listing
   - Submit for review

---

## Post-Deployment

### Monitoring

1. **Health Checks**
   - Verify health check endpoint
   - Monitor service status
   - Check error rates

2. **Analytics**
   - Monitor user engagement
   - Track error rates
   - Review performance metrics

3. **Logs**
   - Review error logs
   - Check crash reports
   - Monitor API usage

### Rollback Plan

If issues are detected:

1. **Immediate Actions**
   - Disable new feature flags
   - Revert to previous version
   - Notify users if needed

2. **Investigation**
   - Review error logs
   - Check health status
   - Identify root cause

3. **Fix & Redeploy**
   - Fix identified issues
   - Test thoroughly
   - Deploy hotfix

---

## CI/CD Integration

### GitHub Actions

The project includes CI/CD workflows:

- **`.github/workflows/ci.yml`**: Continuous Integration
- **`.github/workflows/release.yml`**: Release automation

### Setup

1. **Secrets Configuration**
   - Add `EXPO_TOKEN` to GitHub Secrets
   - Add `CODECOV_TOKEN` (optional)
   - Configure other required secrets

2. **Workflow Triggers**
   - Push to `main` or `develop`: Runs CI
   - Tag with `v*.*.*`: Creates release

---

## Troubleshooting

### Common Issues

**Build Fails**
- Check environment variables
- Verify dependencies
- Review build logs

**Edge Function Errors**
- Check function logs
- Verify secrets
- Test function locally

**Database Issues**
- Verify migrations
- Check RLS policies
- Review connection settings

---

## Security Checklist

- [ ] API keys secured (not in code)
- [ ] Environment variables set
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input sanitization active
- [ ] Error messages don't expose internals
- [ ] HTTPS enforced
- [ ] RLS policies active

---

## Performance Checklist

- [ ] Bundle size optimized
- [ ] Images cached
- [ ] Database queries optimized
- [ ] Network requests minimized
- [ ] Memory leaks fixed
- [ ] Re-renders optimized

---

## Support

For deployment issues:
- Check logs in EAS Dashboard
- Review Supabase logs
- Consult documentation
- Open GitHub issue

---

**Last Updated:** January 2026
