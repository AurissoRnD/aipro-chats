# Chatbot Content Analytics Dashboard

A beautiful analytics dashboard to understand what users are asking your chatbot.

## 🆕 Two Modes Available

### 🌟 Static Mode (NEW - Recommended for browsing conversations)
- **No server required** - just open in browser
- Export data once, view offline
- **Browse full conversation history** with all messages 💬
- Perfect for analysis and reports
- See [QUICK-START.md](QUICK-START.md)

### 🔄 Dynamic Mode (Real-time)
- Live data from MongoDB
- Real-time updates
- Traditional server + dashboard setup
- Instructions below

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The server should start on `http://localhost:3001`

### 3. Open the Dashboard
Simply open `dashboard.html` in your web browser:
```bash
open dashboard.html
```

Or drag the file into your browser.

## 📊 Features

- **Word Cloud**: Visual representation of most common topics
- **Top Questions**: Most frequently asked questions by users
- **Search**: Search through all user messages by keyword
- **Timeline**: User activity over time
- **Conversation Topics**: Popular conversation subjects
- **Message Length Analysis**: Distribution of question lengths
- **Model Usage**: Which AI models are being used

## 🔧 Troubleshooting

### Server won't start
```bash
# Kill any existing process on port 3001
lsof -ti:3001 | xargs kill -9

# Then start again
npm start
```

### Can't connect to MongoDB
Make sure your `.env` file has the correct MongoDB connection string:
```
MONGO_URI=mongodb+srv://your-connection-string
```

### Dashboard shows errors
1. Make sure the server is running (`npm start`)
2. Check that you see "✅ Connected to MongoDB" in the terminal
3. Open browser console (F12) to see any error messages

## 🤖 Do You Need AI/OpenAI?

**Current features work WITHOUT OpenAI** - they use basic text processing and MongoDB queries.

**You WOULD benefit from OpenAI for:**
1. **Topic Clustering**: Automatically group similar questions (e.g., "How do I reset password?" and "Forgot my password" are the same topic)
2. **Sentiment Analysis**: Understand if users are frustrated, happy, or confused
3. **Question Categorization**: Auto-categorize into support types (billing, technical, how-to, etc.)
4. **Smart Search**: Semantic search that finds similar questions even with different wording
5. **Insight Generation**: AI-generated summaries like "Most users are asking about X this week"
6. **Intent Detection**: What users are trying to accomplish

If you want these advanced features, we can add OpenAI integration!

## 📝 API Endpoints

- `GET /api/health` - Server health check
- `GET /api/stats/overview` - Overall statistics
- `GET /api/analytics/top-questions` - Most asked questions
- `GET /api/messages/search?q=keyword` - Search messages
- `GET /api/analytics/timeline` - Activity over time
- `GET /api/analytics/topics` - Popular topics
- `GET /api/analytics/word-frequency` - Word cloud data
- `GET /api/analytics/message-lengths` - Length distribution
- `GET /api/analytics/models` - AI model usage stats

## 📂 Project Structure

```
MVP/
├── server.js                  # Backend API server (dynamic mode)
├── dashboard.html             # Frontend dashboard (dynamic mode)
├── dashboard-static.html      # Static dashboard (no server needed)
├── export-data.js             # Export data from MongoDB
├── explore-schema.js          # MongoDB schema explorer
├── package.json               # Dependencies
├── .env                       # Configuration (MongoDB connection)
├── data/                      # Exported data (created by export script)
├── README.md                  # This file
├── QUICK-START.md            # Quick start guide for static mode
└── STATIC-SITE-README.md     # Detailed static mode documentation
```

## 🌟 Static Mode - Browse Conversations

The static mode lets you export data from MongoDB and browse it offline, including **full conversation history**.

### Quick Start (Static Mode)

1. Export data from database (Nov 11, 2024 - Nov 11, 2025):
   ```bash
   npm run export
   ```

2. Open the static dashboard:
   ```bash
   open dashboard-static.html
   ```

3. Browse:
   - All statistics and analytics
   - Full conversation history
   - Individual chat messages
   - Search conversations and messages

See [QUICK-START.md](QUICK-START.md) for detailed instructions.

