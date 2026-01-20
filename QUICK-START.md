# 🚀 Quick Start - Static Analytics Dashboard

## Step 1: Export Data from Database

Make sure your `.env` file exists with your MongoDB connection:

```bash
MONGO_URI=your_mongodb_connection_string_here
```

Export data from **November 11, 2024 to November 11, 2025**:

```bash
npm run export
```

or

```bash
node export-data.js
```

This creates a `data/` directory with 10 JSON files containing:
- Overview statistics
- Top questions
- Timeline data
- Word cloud data
- **Full conversations with all messages** 💬
- Searchable message index

## Step 2: Open the Static Dashboard

### Option A: Direct File (Simple)
```bash
# Mac
open dashboard-static.html

# Linux
xdg-open dashboard-static.html

# Windows
start dashboard-static.html
```

### Option B: Local Server (Recommended)
```bash
# Using Python
python3 -m http.server 8000

# Using Node
npx http-server

# Then open: http://localhost:8000/dashboard-static.html
```

## 📊 What You Can Do

### Overview Tab
- See overall statistics
- Search all user messages
- View word cloud of popular topics
- Browse top questions
- Analyze activity timeline

### Browse Conversations Tab ⭐
- **View all conversations** from the date range
- **Search by conversation title**
- **Click any conversation** to see the full chat history
- **Read user questions and AI responses**
- Analyze actual user interactions

## 🔄 Update Data

To refresh with new data, just run the export again:

```bash
npm run export
```

Then refresh your browser!

## 📁 What Gets Created

```
data/
├── conversations.json          ← Full chats with messages! 💬
├── all-messages.json          ← Searchable user messages
├── top-questions.json
├── overview.json
├── timeline.json
├── topics.json
└── ... (7 more files)
```

## ⚠️ Important

- The `data/` folder contains actual user conversations
- It's already in `.gitignore` to prevent accidental commits
- Keep this data secure and private!

## 🆘 Troubleshooting

**"Data Not Found" error**
→ Run `npm run export` first!

**Can't connect to MongoDB**
→ Check your `.env` file has the correct `MONGO_URI`

**No conversations showing**
→ Check date range in `export-data.js` matches your data

---

For more details, see [STATIC-SITE-README.md](STATIC-SITE-README.md)

