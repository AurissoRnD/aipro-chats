# Deploy to Render - Step by Step Guide

Your static dashboard is ready to deploy! Follow these simple steps:

## 🚀 Deployment Steps

### 1. Go to Render
Visit: https://render.com/

### 2. Sign In / Sign Up
- Click "Get Started" or "Sign In"
- You can sign in with your GitHub account (recommended)

### 3. Create New Static Site
- Click "New +" button (top right)
- Select "Static Site"

### 4. Connect Your Repository
- Select "Connect a repository"
- Choose: **AurissoRnD/aipro-chats**
- Click "Connect"

### 5. Configure the Site
Fill in these settings:

**Name:** `aipro-chats-dashboard` (or your choice)

**Branch:** `main`

**Build Command:** Leave empty (or put: `echo "No build needed"`)

**Publish Directory:** `.` (dot means root directory)

**Auto-Deploy:** ✅ Yes (recommended)

### 6. Deploy!
- Click "Create Static Site"
- Render will deploy your site (takes 1-2 minutes)

## ✅ Your Dashboard Will Be Live!

Once deployed, you'll get a URL like:
```
https://aipro-chats-dashboard.onrender.com
```

The dashboard will automatically redirect from the home page to `dashboard-static.html`

## 📊 What's Included

Your deployed dashboard shows:
- ✅ Overview statistics (total messages, users, conversations)
- ✅ Search functionality for user prompts
- ✅ Most frequently asked questions
- ✅ All user messages (cleaned, no system prompts)
- ✅ Activity timeline charts
- ✅ Popular conversation topics
- ✅ Message length distribution
- ✅ AI model usage stats
- ✅ Info icons explaining each section

## 🔄 Future Updates

To update the dashboard:
1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update dashboard"
   git push
   ```
3. Render will automatically redeploy (if Auto-Deploy is enabled)

## 🔒 Security Note

- ✅ API keys have been redacted from data files
- ✅ `.env` file is not included (in .gitignore)
- ✅ Only safe, sanitized data is public

## 📝 Custom Domain (Optional)

In Render dashboard:
1. Go to your site settings
2. Click "Custom Domains"
3. Add your domain (e.g., `analytics.yourcompany.com`)
4. Follow DNS instructions

---

**Need Help?** Check Render's documentation: https://render.com/docs/static-sites
