# Deployment Guide - Mitchly Music Generator

## 🚀 Quick Start

This application is ready for secure deployment to Netlify with your Anthropic API key protected server-side.

## 📋 Prerequisites

1. **Anthropic API Key** - Get one from [Anthropic Console](https://console.anthropic.com/)
2. **GitHub Account** - For repository hosting
3. **Netlify Account** - Free tier works fine

## 🔒 Security Configuration

This app uses **Netlify Serverless Functions** to protect your API key:
- ✅ API key stays server-side only
- ✅ Never exposed in browser code
- ✅ Secure for production use
- ✅ Uses latest Claude Sonnet 4 model

## 📝 Step-by-Step Deployment

### 1. Add Your API Key Locally

Edit the `.env` file (already created for you):
```bash
VITE_ANTHROPIC_API_KEY=your_actual_api_key_here
```

### 2. Test Locally (Optional)

```bash
npm install
npm run dev
```
Visit http://localhost:5173 to test

### 3. Push to GitHub

Create a new repository on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 4. Deploy to Netlify

#### Option A: Via Netlify Dashboard (Recommended)

1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and select your repository
4. Build settings will auto-detect:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"

#### Option B: Via Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### 5. Configure Environment Variable on Netlify

**CRITICAL STEP - Your API key must be added here:**

1. In Netlify Dashboard, go to your site
2. Navigate to **Site settings** → **Environment variables**
3. Click "Add a variable"
4. Add:
   - Key: `VITE_ANTHROPIC_API_KEY`
   - Value: `your_actual_anthropic_api_key`
5. Click "Save"
6. **Redeploy** your site for changes to take effect:
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**

## 🔍 How It Works

### Production (Netlify)
- Client → Netlify Function → Anthropic API
- API key stored in Netlify environment variables
- Serverless functions handle all API calls
- Zero exposure of sensitive data

### Local Development
- Can use direct API calls for faster development
- API key from local .env file
- Falls back to serverless functions if no key

## 📁 Project Structure

```
mitchly-music-generator/
├── netlify/
│   └── functions/          # Serverless functions (secure API calls)
│       ├── generate-band.js
│       └── generate-song.js
├── src/
│   └── services/
│       └── anthropic.js   # Smart routing (serverless vs direct)
├── .env                    # Local API key (git ignored)
├── .env.example           # Template for developers
└── netlify.toml           # Netlify configuration
```

## ✅ Security Checklist

- [x] API key in .env (local only)
- [x] .env in .gitignore
- [x] Serverless functions created
- [x] Frontend uses function endpoints
- [x] Production uses environment variables
- [x] No API key in client-side code

## 🚨 Common Issues

### "Failed to generate" Error
- Check API key is added in Netlify environment variables
- Ensure you triggered a redeploy after adding the key
- Verify API key has sufficient credits

### Functions Not Working
- Check Netlify dashboard → Functions tab for errors
- Ensure `netlify/functions/` directory is deployed
- Verify CORS headers in function responses

### Local Development Issues
- Run `npm install` to ensure dependencies
- Add API key to `.env` file (not .env.example)
- Check console for specific error messages

## 🔄 Updating

To update the deployed site:

```bash
git add .
git commit -m "Your update message"
git push
```

Netlify will automatically rebuild and deploy.

## 📊 Monitoring

- **Netlify Dashboard** - View deploys, functions, and logs
- **Functions Tab** - Monitor API usage and errors
- **Analytics** - Track site usage (if enabled)

## 💰 Cost Considerations

- **Netlify Free Tier**: 125k function requests/month
- **Anthropic API**: Pay per token used
- Monitor usage in both dashboards

## 🆘 Support

- **Netlify Issues**: [Netlify Support](https://answers.netlify.com/)
- **API Issues**: [Anthropic Support](https://support.anthropic.com/)
- **App Issues**: Check GitHub Issues

---

© 2025 Mitchly. Secure deployment configuration.