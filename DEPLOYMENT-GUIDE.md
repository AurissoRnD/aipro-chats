# 🚀 Deployment Guide for Render

## Overview

This guide will walk you through deploying your chatbot analytics dashboard to Render with:
- ✅ Static dashboard (fast, works offline)
- ✅ AI chatbot (OpenAI + Weaviate)  
- ✅ 2M+ conversations indexed
- ✅ User statistics and analytics

## 📊 Your Data Size

Based on analysis:
- **2,018,126 conversations**
- **815,146 unique users**
- **13.1M total messages**
- **6.4M user messages**

## 🎯 Architecture

```
Render Web Service
├── Serves: dashboard-static.html (frontend)
├── Serves: data/*.json (static analytics)
└── API: /api/chatbot (uses Weaviate + OpenAI)
```

---

## Step 1: Setup Weaviate Cloud (Free)

### 1.1 Create Weaviate Account

1. Go to https://console.weaviate.cloud
2. Sign up for free account
3. Create a new cluster:
   - Cluster name: `chatbot-analytics` (or any name)
   - Select: **Sandbox** (Free tier)
   - Click "Create"

### 1.2 Get Your Credentials

After cluster is created:
1. Click on your cluster
2. Copy the **Cluster URL** (e.g., `https://your-cluster-xyz.weaviate.network`)
3. Go to "API Keys" tab
4. Click "Generate API Key"
5. Copy the **API Key**

### 1.3 Update .env File

Add to your `.env` file:

```bash
# MongoDB (for exporting data)
MONGO_URI=your_mongodb_connection_string

# OpenAI (for embeddings and chatbot)
OPENAI_API_KEY=sk-your-openai-key

# Weaviate Cloud (free tier)
WEAVIATE_URL=https://your-cluster-xyz.weaviate.network
WEAVIATE_API_KEY=your-weaviate-api-key
```

---

## Step 2: Export and Upload Data

### 2.1 Install Dependencies

```bash
npm install
```

### 2.2 Export Data from MongoDB

This exports data from 11.11.2024 to 11.11.2025:

```bash
npm run export
```

This creates:
- `data/overview.json`
- `data/user-stats.json` ← NEW! User statistics
- `data/conversations.json` (500 most recent)
- `data/top-questions.json`
- And 7 more files...

**Takes:** ~10-15 minutes with your data size

### 2.3 Upload to Weaviate

Upload conversations to Weaviate vector DB:

```bash
npm run upload:weaviate
```

This will:
- Filter to 5,000 quality conversations (3-100 messages each)
- Create embeddings using OpenAI ada-002
- Upload to Weaviate in batches

**Takes:** ~15-20 minutes  
**Cost:** ~$0.05 (one-time for embeddings)

---

## Step 3: Test Locally

Before deploying, test everything works:

```bash
npm start
```

Then open: http://localhost:3000

**Test:**
1. ✅ Dashboard loads with stats
2. ✅ Browse conversations tab works
3. ✅ AI chatbot responds to questions
4. ✅ User stats shown (815K users, avg per day)

**Try asking:**
- "What are the most common user problems?"
- "Show me billing-related conversations"
- "What features do users request?"

---

## Step 4: Deploy to Render

### 4.1 Prepare Your Repository

```bash
# Make sure data folder is committed (needed for static dashboard)
git add data/*.json
git add dashboard-static.html chatbot-server.js
git add package.json

git commit -m "Add chatbot with Weaviate integration"
git push origin main
```

**Note:** `.gitignore` excludes the data folder, but you NEED it for deployment.  
**Solution:** Either:
1. Remove `data/` from `.gitignore` temporarily, OR
2. Upload data manually to Render (see 4.5)

### 4.2 Create Render Web Service

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub/GitLab repository
4. Select your repository

### 4.3 Configure Service

**Settings:**
- **Name:** `chatbot-analytics-dashboard`
- **Environment:** `Node`
- **Region:** Choose closest to you
- **Branch:** `main`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** Free (or Starter $7/month for better performance)

### 4.4 Add Environment Variables

Click "Advanced" → "Add Environment Variable":

```
OPENAI_API_KEY = sk-your-openai-key-here
WEAVIATE_URL = https://your-cluster.weaviate.network
WEAVIATE_API_KEY = your-weaviate-api-key
PORT = 3000
```

**DO NOT** add `MONGO_URI` - not needed in production!

### 4.5 Handle Data Files

**Option A: Commit data folder** (Recommended)

Edit `.gitignore`, temporarily remove the `data/` line:
```bash
# Comment out this line:
# data/

# Or remove it entirely
```

Then commit:
```bash
git add data/
git commit -m "Add data files for deployment"
git push
```

**Option B: Manual upload**

Use Render's persistent disk feature (only on paid plans).

### 4.6 Deploy!

Click **"Create Web Service"**

Render will:
1. Clone your repository
2. Run `npm install`
3. Start the server with `npm start`

**Deployment takes:** ~2-3 minutes

---

## Step 5: Access Your Dashboard

Once deployed:

1. Render gives you a URL: `https://your-app.onrender.com`
2. Open it in your browser
3. **Share with your boss!** 🎉

---

## 📊 What Your Boss Will See

### Main Dashboard Page

```
🤖 Chatbot Analytics Dashboard
📅 Nov 11, 2024 - Nov 11, 2025

┌─────────────┬─────────────┬─────────────┬─────────────┐
│  13.1M      │   6.5M      │   2.0M      │    6.6      │
│  Messages   │  Questions  │  Convos     │  Avg Msgs   │
└─────────────┴─────────────┴─────────────┴─────────────┘

┌─────────────┬─────────────┐
│   815K      │   2,230     │
│   Users     │  Users/Day  │
└─────────────┴─────────────┘

🔍 Search user messages...
☁️  Word cloud
❓ Top questions
📊 Activity timeline
💬 Popular topics

🤖 Ask AI About Your Data
[Ask anything about the data...]
```

### Chatbot Examples

Your boss can ask:
- "What do users complain about most?"
- "Show me password reset issues"
- "What billing problems came up?"
- "Summarize technical support requests"
- "What features do users want?"

---

## 💰 Cost Breakdown

### One-time Setup
- **Weaviate embeddings:** ~$0.05 (5K conversations × ada-002)
- **Total setup:** ~$0.05

### Monthly Running Costs

**Option 1: Free Tier**
- Render: $0 (with limitations: sleeps after 15min inactivity)
- Weaviate: $0 (free tier)
- OpenAI queries: ~$0.50/month (100 questions × gpt-3.5-turbo)
- **Total:** ~$0.50/month

**Option 2: Production (Recommended for boss)**
- Render Starter: $7/month (always on, faster)
- Weaviate: $0 (free tier)
- OpenAI queries: ~$0.50/month
- **Total:** ~$7.50/month

---

## 🔧 Maintenance

### Updating Data

To refresh with new data:

```bash
# 1. Export new data
npm run export

# 2. Upload new conversations to Weaviate
npm run upload:weaviate

# 3. Commit and push
git add data/
git commit -m "Update data"
git push
```

Render will automatically redeploy!

### Monitoring

Check logs in Render dashboard:
- See chatbot questions
- Monitor OpenAI usage
- Check for errors

---

## 🐛 Troubleshooting

### "Data Not Found" Error

**Problem:** `data/` folder not deployed

**Solution:** Make sure `data/*.json` files are committed:
```bash
git add -f data/*.json
git commit -m "Add data files"
git push
```

### "Chatbot unavailable"

**Problem:** Weaviate not connected

**Solution:** Check environment variables in Render:
- `WEAVIATE_URL` - correct?
- `WEAVIATE_API_KEY` - correct?
- Check Weaviate cluster is running

### Slow AI Responses

**Problem:** Using GPT-4 (expensive and slow)

**Solution:** Already using gpt-3.5-turbo (fast and cheap)

### Dashboard loads but no data

**Problem:** Data files not served

**Solution:** Make sure data folder is in repository

---

## 🎯 Performance Tips

### For Free Tier

If using Render free tier (sleeps after 15min):
- First load after sleep: ~30 seconds (cold start)
- Subsequent loads: instant
- Chatbot queries: 2-3 seconds

### For Paid Tier ($7/month)

- Always on (no cold starts)
- First load: instant
- Chatbot queries: 2-3 seconds

### Optimizations

**Already implemented:**
- ✅ Static dashboard (no DB queries for charts)
- ✅ Using gpt-3.5-turbo (fast + cheap)
- ✅ Limited context (500 tokens max)
- ✅ Quality conversation filtering

---

## 📝 Summary Checklist

- [ ] Setup Weaviate Cloud account
- [ ] Add credentials to `.env`
- [ ] Run `npm run export`
- [ ] Run `npm run upload:weaviate`
- [ ] Test locally with `npm start`
- [ ] Commit data files
- [ ] Create Render web service
- [ ] Add environment variables to Render
- [ ] Deploy!
- [ ] Share link with boss 🎉

---

## 🆘 Need Help?

**Weaviate Issues:**
- Docs: https://weaviate.io/developers/weaviate
- Support: https://forum.weaviate.io

**Render Issues:**
- Docs: https://render.com/docs
- Support: https://render.com/docs/support

**OpenAI Issues:**
- Docs: https://platform.openai.com/docs
- Check API key is valid
- Check billing is enabled

---

## 🎉 You're Done!

Your boss now has:
- 📊 Beautiful analytics dashboard
- 💬 Browse 500 recent conversations
- 🤖 AI chatbot that answers questions about 5K conversations
- 👥 User statistics (815K users!)
- 📈 Activity trends and insights

**Share the link and impress! 🚀**

