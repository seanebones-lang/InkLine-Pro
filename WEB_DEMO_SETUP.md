# Web Demo Setup - Quick Guide

## ✅ What's Ready

A complete web demo version has been set up on the `web-demo` branch with:

- ✅ All UI screens working
- ✅ Mocked authentication (auto-login)
- ✅ Mocked AI generation (2s delay, shows placeholder)
- ✅ Pre-loaded history (3 sample designs)
- ✅ All animations working
- ✅ Theme switching
- ✅ Navigation between screens

## 🚀 Quick Start

**Option 1: Use the script (easiest)**
```bash
npm run demo
```

**Option 2: Manual**
```bash
export EXPO_PUBLIC_WEB_DEMO=true
npm run web
```

The app will open in your browser at `http://localhost:8081` (or similar port).

## 📱 For Client Meeting

1. **Start the demo:**
   ```bash
   npm run demo
   ```

2. **Share your screen** (Zoom, Teams, etc.)

3. **Navigate through:**
   - Home screen
   - Generate screen (show the flow)
   - History screen (show pre-loaded designs)
   - Profile screen

4. **Demonstrate:**
   - Enter a description and "generate" (will show placeholder after 2s)
   - Upload an image (file picker works)
   - View history items
   - Delete/share actions
   - Theme switching

## 🎯 What Works

| Feature | Status | Notes |
|---------|--------|-------|
| UI/UX | ✅ Full | All screens, animations, themes |
| Navigation | ✅ Full | Tab navigation works |
| Generate Flow | ✅ Mocked | 2s delay, placeholder image |
| History | ✅ Mocked | 3 pre-loaded designs |
| Image Upload | ✅ Works | File picker works on web |
| Share/Download | ✅ Works | Downloads image file |
| Auth | ✅ Mocked | Auto-logged in as demo user |
| Subscription | ✅ Mocked | Always shows as active |

## ❌ What Doesn't Work (Expected)

- Bluetooth printing (not available on web)
- Real AI generation (mocked with placeholder)
- Real database (in-memory only, clears on refresh)
- Camera (file upload works instead)

## 📝 Files Changed

- `src/config/webDemo.ts` - Demo configuration
- `src/services/mockServices.ts` - All mocked services
- `src/config/supabase.web.ts` - Web-specific Supabase config
- `src/contexts/AuthContext.web.tsx` - Web demo auth
- `src/services/*.web.ts` - Web service wrappers
- `App.tsx` - Conditional provider loading
- `src/screens/*.tsx` - Conditional service imports

## 🌐 Deploy to Vercel (Optional)

Want to share a live URL instead of screen sharing?

**Quick deploy:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Or use GitHub integration:**
1. Push `web-demo` branch to GitHub
2. Connect to Vercel
3. Auto-deploys on every push

See `VERCEL_DEPLOY.md` for full instructions.

**Benefits:**
- ✅ Client can access anytime
- ✅ Works on any device
- ✅ No screen sharing needed
- ✅ Shareable URL

## 🔄 After Meeting

**To switch back to real app:**
```bash
git checkout main
```

**Or continue on web-demo branch:**
- All changes are isolated to this branch
- Can merge later if needed
- Real app unaffected

## 💡 Tips

- **Refresh clears data** - All mock data is in-memory
- **Placeholder images** - 1x1 transparent PNG (visual only)
- **No backend needed** - Everything is mocked
- **Perfect for UI/UX demo** - Shows look and feel, not functionality

## 🐛 Troubleshooting

**App won't start:**
- Make sure you're on `web-demo` branch
- Run `npm install` if needed
- Check that port 8081 is available

**Services not mocked:**
- Verify `EXPO_PUBLIC_WEB_DEMO=true` is set
- Check browser console for errors
- Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

**Images not showing:**
- Placeholder images are intentionally minimal
- Real images would work if you add sample base64 data to `mockServices.ts`

---

**Ready to demo!** Just run `npm run demo` and share your screen. 🎉
