# Wedding Hub

A shared wedding planning app for two. Built with Next.js, Vercel KV, and love.

## Deploy in 5 minutes

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "wedding hub"
git remote add origin https://github.com/YOUR_USERNAME/wedding-hub.git
git push -u origin main
```

### 2. Deploy on Vercel
- Go to [vercel.com/new](https://vercel.com/new)
- Import your GitHub repo
- Deploy (it'll build automatically)

### 3. Add Vercel KV (shared data storage)
- In your Vercel project dashboard, go to **Storage**
- Click **Create Database** → **KV (Redis)**
- Name it `wedding-hub-data`
- Connect it to your project
- Redeploy (Vercel auto-injects the KV environment variables)

### 4. Set your custom domain (optional)
- In Vercel project settings → **Domains**
- Add a custom domain or use the free `.vercel.app` subdomain

### 5. Share with your bride
- Send her the URL
- Both bookmark it on your phones
- Both can edit tasks, budget, timeline — all synced

## Claude Chat
The "Ask Claude" feature calls the Anthropic API directly from the browser. 
For it to work in production, you'll need to set up a proxy API route with your Anthropic API key.
For now, it works in the Claude artifact version.

## Tech stack
- Next.js 14 (App Router)
- Vercel KV (Redis) for shared data
- TypeScript
- DM Sans font
- Zero external UI libraries
