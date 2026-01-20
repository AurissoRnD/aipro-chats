# Static Analytics Dashboard

This is a static version of the chatbot analytics dashboard that works without a server. All data is pre-exported from MongoDB and served as JSON files.

## 📅 Data Period
**November 11, 2024 - November 11, 2025**

## 🚀 Quick Start

### Step 1: Export Data from Database

First, make sure your `.env` file has the MongoDB connection string:

```env
MONGO_URI=your_mongodb_connection_string
```

Then run the export script:

```bash
node export-data.js
```

This will create a `./data/` directory with all the exported JSON files:
- `overview.json` - Overall statistics
- `top-questions.json` - Most frequently asked questions
- `timeline.json` - Daily message counts
- `word-frequency.json` - Word cloud data
- `message-lengths.json` - Message length distribution
- `conversation-stats.json` - Conversation statistics
- `topics.json` - Popular conversation topics
- `model-stats.json` - AI model usage stats
- **`conversations.json`** - Full conversation history with all messages
- `all-messages.json` - Searchable index of user messages

### Step 2: View the Static Dashboard

Simply open `dashboard-static.html` in your web browser:

```bash
# On Mac:
open dashboard-static.html

# On Linux:
xdg-open dashboard-static.html

# On Windows:
start dashboard-static.html
```

Or use a simple HTTP server (recommended for better performance):

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js
npx http-server

# Then open http://localhost:8000/dashboard-static.html
```

## 📊 Features

### Overview Tab
- **Statistics Cards**: Total messages, user questions, conversations, and averages
- **Search**: Search through all user messages in real-time
- **Word Cloud**: Visual representation of most common topics
- **Top Questions**: Most frequently asked questions with counts
- **Activity Timeline**: Daily message volume over time
- **Popular Topics**: Most common conversation subjects
- **Message Length Distribution**: How long are user questions?
- **AI Model Usage**: Which models are being used most

### Browse Conversations Tab
- **Full Conversation History**: View all conversations from the date range
- **Search Conversations**: Filter by conversation title
- **Read Full Chats**: Click any conversation to see the complete message history
- **Message Bubbles**: User and AI messages displayed in a chat-like interface
- **Timestamps**: See when each message was sent

## 🎯 Use Cases

1. **Content Analysis**: Understand what users are asking about
2. **Training Data**: Identify gaps in chatbot knowledge
3. **User Research**: Learn about user needs and pain points
4. **Product Insights**: Discover feature requests and issues
5. **Quality Assurance**: Review actual conversations to improve responses

## 📁 File Structure

```
MVP/
├── dashboard-static.html    # Static dashboard (no server needed)
├── export-data.js           # Script to export data from MongoDB
├── data/                    # Exported data (created by export script)
│   ├── overview.json
│   ├── top-questions.json
│   ├── timeline.json
│   ├── word-frequency.json
│   ├── message-lengths.json
│   ├── conversation-stats.json
│   ├── topics.json
│   ├── model-stats.json
│   ├── conversations.json   # Full conversation history
│   └── all-messages.json
├── server.js                # Original dynamic server (optional)
└── dashboard.html           # Original dynamic dashboard (optional)
```

## 🔄 Updating Data

To refresh the dashboard with new data:

1. Run the export script again:
   ```bash
   node export-data.js
   ```

2. Refresh your browser

The export script will always fetch data from **November 11, 2024 to November 11, 2025**.

## 🛠️ Customization

### Change Date Range

Edit `export-data.js` and modify these lines:

```javascript
const START_DATE = new Date('2024-11-11T00:00:00.000Z');
const END_DATE = new Date('2025-11-11T23:59:59.999Z');
```

### Export Limits

The export script has some limits to keep file sizes manageable:

- **Conversations**: 500 most recent
- **User Messages**: 10,000 most recent (for search)
- **Top Questions**: 200
- **Topics**: 100
- **Word Cloud Sample**: 20,000 messages
- **Message Lengths Sample**: 10,000 messages

You can adjust these in `export-data.js` if needed.

## 📊 Data Privacy

⚠️ **Important**: The exported JSON files contain actual user messages and conversations. 

- Keep the `./data/` directory secure
- Don't commit it to version control (add to `.gitignore`)
- Be careful when sharing the static site

Consider anonymizing or redacting sensitive information before sharing.

## 🆚 Static vs Dynamic

### Static Version (dashboard-static.html)
✅ No server needed  
✅ Fast loading (all data pre-fetched)  
✅ Can be hosted anywhere (S3, GitHub Pages, etc.)  
✅ Works offline  
❌ Data is fixed (need to re-export to update)  
❌ Larger initial download

### Dynamic Version (dashboard.html + server.js)
✅ Real-time data  
✅ Smaller page size  
✅ Always up-to-date  
❌ Requires Node.js server  
❌ Needs MongoDB connection  
❌ More complex deployment

## 🚀 Deployment

### GitHub Pages
1. Export your data
2. Push to GitHub
3. Enable GitHub Pages on your repo
4. Access via `https://yourusername.github.io/repo-name/dashboard-static.html`

### AWS S3
1. Export your data
2. Upload `dashboard-static.html` and `data/` directory to S3 bucket
3. Enable static website hosting
4. Access via S3 website URL

### Netlify / Vercel
1. Export your data
2. Drag and drop your folder to Netlify or Vercel
3. Your site is live!

## 💡 Tips

- Use browser search (Ctrl/Cmd + F) within conversations
- Click on questions to search for similar ones
- The word cloud is interactive - larger words appear more frequently
- Use the conversation search to find specific topics quickly
- Open the browser console (F12) to see data loading logs

## 🐛 Troubleshooting

**"Data Not Found" error**
- Make sure you ran `node export-data.js` first
- Check that the `./data/` directory exists and has JSON files

**Word cloud not showing**
- Check browser console for errors
- Some ad blockers may interfere with external scripts

**Large file sizes**
- Reduce sample sizes in `export-data.js`
- Compress JSON files with gzip for hosting

**Slow loading**
- Use a local HTTP server instead of opening files directly
- Consider reducing the number of exported conversations

## 📝 License

Same as the main project.

