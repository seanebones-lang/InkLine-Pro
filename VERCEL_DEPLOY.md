# Deploy Web Demo to Vercel

This guide shows how to deploy the InkLine Pro web demo to Vercel for easy client access.

## 🚀 Quick Deploy

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from web-demo branch:**
   ```bash
   git checkout web-demo
   vercel
   ```

4. **Follow prompts:**
   - Link to existing project? **No** (first time) or **Yes** (updates)
   - Project name: `inklinepro-demo` (or your choice)
   - Directory: `.` (current directory)
   - Override settings? **No**

5. **Your demo is live!** 🎉
   - URL will be: `https://inklinepro-demo.vercel.app`
   - Or custom domain if configured

### Option 2: GitHub Integration (Automatic)

1. **Push web-demo branch to GitHub:**
   ```bash
   git push origin web-demo
   ```

2. **Go to [vercel.com](https://vercel.com)**
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your repository
   - Select `web-demo` branch

3. **Configure:**
   - Framework Preset: **Other**
   - Root Directory: `.`
   - Build Command: `npm run build:web:demo`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Environment Variables (add in Settings → Environment Variables):
     - `EXPO_PUBLIC_WEB_DEMO` = `true`

4. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your demo is live!

### Option 3: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `.`
   - **Build Command:** `npm run build:web:demo`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Environment Variables:**
     ```
     EXPO_PUBLIC_WEB_DEMO=true
     ```
4. Click "Deploy"

## 📝 Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
EXPO_PUBLIC_WEB_DEMO=true
```

This enables web demo mode with mocked services.

## 🔄 Updating the Demo

### Via CLI:
```bash
vercel --prod
```

### Via GitHub:
- Push to `web-demo` branch
- Vercel auto-deploys (if GitHub integration enabled)

## 🌐 Custom Domain (Optional)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your domain (e.g., `demo.inklinepro.com`)
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-60 minutes)

## 📋 What Gets Deployed

- ✅ All UI screens
- ✅ Mocked authentication
- ✅ Mocked AI generation
- ✅ Pre-loaded history
- ✅ All animations
- ✅ Theme switching
- ✅ Static assets

## ⚠️ Important Notes

1. **Branch:** Make sure you're on `web-demo` branch
2. **Build Time:** First build takes 3-5 minutes
3. **Updates:** Subsequent builds are faster (1-2 minutes)
4. **Data:** All data is in-memory (refreshing clears it)
5. **No Backend:** Everything is mocked

## 🐛 Troubleshooting

**Build fails:**
- Check that `EXPO_PUBLIC_WEB_DEMO=true` is set
- Verify you're on `web-demo` branch
- Check build logs in Vercel dashboard

**App doesn't load:**
- Check browser console for errors
- Verify the build completed successfully
- Try hard refresh (Cmd+Shift+R)

**404 errors:**
- The `vercel.json` rewrite rule should handle this
- If not, check that `outputDirectory` matches build output

## 🔗 Share with Client

Once deployed, share the Vercel URL:
```
https://your-project.vercel.app
```

They can:
- View on any device (desktop, tablet, mobile)
- Test all UI features
- See animations and interactions
- No installation needed!

## 💰 Cost

- **Free tier:** Unlimited deployments
- **Hobby plan:** Free for personal projects
- **Team plan:** $20/month (if needed for team)

---

**Ready to deploy?** Run `vercel` from the `web-demo` branch! 🚀
