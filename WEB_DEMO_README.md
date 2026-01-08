# Web Demo Setup

This branch contains a web-optimized version of InkLine Pro for client preview during iteration meetings.

## Quick Start

1. **Enable Web Demo Mode:**
   ```bash
   export EXPO_PUBLIC_WEB_DEMO=true
   ```

2. **Start Web Server:**
   ```bash
   npm run web
   ```

3. **Open in Browser:**
   - The app will open at `http://localhost:8081` (or the port shown)
   - Share your screen during the meeting

## Features

✅ **Fully Functional UI:**
- All screens visible and navigable
- Animations work (Reanimated 3)
- Theme switching works
- Tab navigation works

✅ **Mocked Features:**
- Auto-login (demo user)
- AI generation (2s delay, placeholder image)
- History (3 pre-loaded designs)
- Subscription (always active)
- Print/Share (downloads image)

❌ **Disabled Features:**
- Bluetooth printing (not available on web)
- Camera (file upload works instead)
- Real API calls (all mocked)
- Database storage (in-memory only)

## What Works

- **Generate Screen:** Enter description, upload image, generate design (shows placeholder)
- **History Screen:** View 3 pre-loaded designs, delete, share
- **Profile Screen:** View demo profile
- **Home Screen:** All UI elements visible
- **Navigation:** All tabs work
- **Animations:** Smooth 60fps animations
- **Theme:** Dark/light mode toggle

## For Client Demo

1. Start the web server
2. Share your screen
3. Navigate through all screens
4. Show generation flow (it will "work" with placeholder)
5. Show history with pre-loaded designs
6. Demonstrate UI/UX features

## Notes

- All data is in-memory (refreshing clears it)
- Images are placeholders (1x1 transparent PNG)
- No real backend calls
- Perfect for showing UI/UX, not functionality

## After Demo

Switch back to main branch:
```bash
git checkout main
```

Or continue development on this branch and merge later.
