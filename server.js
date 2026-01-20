const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3001;

let db;
let messagesCollection;
let conversationsCollection;

// Connect to MongoDB
const client = new MongoClient(MONGO_URI);

async function connectDB() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    db = client.db('chatgpt_aipro');
    messagesCollection = db.collection('messages');
    conversationsCollection = db.collection('conversations');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get overview statistics
app.get('/api/stats/overview', async (req, res) => {
  try {
    const totalMessages = await messagesCollection.countDocuments();
    const totalUserMessages = await messagesCollection.countDocuments({ isCreatedByUser: true });
    const totalConversations = await conversationsCollection.countDocuments();
    
    // Get date range
    const oldestMessage = await messagesCollection.findOne({}, { sort: { createdAt: 1 } });
    const newestMessage = await messagesCollection.findOne({}, { sort: { createdAt: -1 } });
    
    res.json({
      totalMessages,
      totalUserMessages,
      totalConversations,
      dateRange: {
        start: oldestMessage?.createdAt,
        end: newestMessage?.createdAt
      }
    });
  } catch (error) {
    console.error('Error in overview stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all user messages with pagination (for word cloud processing)
app.get('/api/messages/user', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 5000, 10000); // Cap at 10k
  const skip = (page - 1) * limit;
  
  try {
    const messages = await messagesCollection
      .find({ 
        isCreatedByUser: true,
        text: { $exists: true, $ne: '', $ne: null }
      })
      .project({ text: 1, createdAt: 1, conversationId: 1, _id: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get top questions by exact match frequency
app.get('/api/analytics/top-questions', async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  
  try {
    const topQuestions = await messagesCollection.aggregate([
      { 
        $match: { 
          isCreatedByUser: true,
          text: { $exists: true, $ne: '', $ne: null },
          sender: 'User'
        } 
      },
      { 
        $group: { 
          _id: '$text',
          count: { $sum: 1 },
          lastAsked: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      { 
        $project: { 
          question: '$_id',
          count: 1,
          lastAsked: 1,
          _id: 0 
        } 
      }
    ]).toArray();
    
    res.json(topQuestions);
  } catch (error) {
    console.error('Error in top questions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search messages by keyword
app.get('/api/messages/search', async (req, res) => {
  const keyword = req.query.q;
  const limit = parseInt(req.query.limit) || 50;
  
  if (!keyword || keyword.length < 2) {
    return res.json([]);
  }
  
  try {
    const results = await messagesCollection
      .find({ 
        isCreatedByUser: true,
        text: { $regex: keyword, $options: 'i' }
      })
      .project({ text: 1, createdAt: 1, conversationId: 1, _id: 0 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    res.json(results);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages timeline (daily counts)
app.get('/api/analytics/timeline', async (req, res) => {
  const days = parseInt(req.query.days) || 90; // Default last 90 days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  try {
    const timeline = await messagesCollection.aggregate([
      { 
        $match: { 
          isCreatedByUser: true,
          createdAt: { $gte: startDate }
        } 
      },
      { 
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { 
        $project: { 
          date: '$_id',
          count: 1,
          _id: 0 
        } 
      }
    ]).toArray();
    
    res.json(timeline);
  } catch (error) {
    console.error('Error in timeline:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get word frequency data (sampled for performance)
app.get('/api/analytics/word-frequency', async (req, res) => {
  const sampleSize = parseInt(req.query.sample) || 20000;
  
  try {
    const messages = await messagesCollection.aggregate([
      { 
        $match: { 
          isCreatedByUser: true,
          text: { $exists: true, $ne: '', $ne: null }
        } 
      },
      { $sample: { size: sampleSize } },
      { $project: { text: 1, _id: 0 } }
    ]).toArray();
    
    res.json(messages);
  } catch (error) {
    console.error('Error in word frequency:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get message length statistics
app.get('/api/analytics/message-lengths', async (req, res) => {
  const sampleSize = parseInt(req.query.sample) || 10000;
  
  try {
    const messages = await messagesCollection.aggregate([
      { 
        $match: { 
          isCreatedByUser: true,
          text: { $exists: true, $ne: '', $ne: null }
        } 
      },
      { $sample: { size: sampleSize } },
      { 
        $project: { 
          length: { $strLenCP: '$text' },
          _id: 0 
        } 
      }
    ]).toArray();
    
    res.json(messages);
  } catch (error) {
    console.error('Error in message lengths:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get conversation statistics
app.get('/api/analytics/conversations', async (req, res) => {
  try {
    // Average messages per conversation
    const conversationStats = await messagesCollection.aggregate([
      { $match: { isCreatedByUser: true } },
      { 
        $group: { 
          _id: '$conversationId',
          messageCount: { $sum: 1 }
        } 
      },
      { 
        $group: {
          _id: null,
          avgMessagesPerConversation: { $avg: '$messageCount' },
          maxMessages: { $max: '$messageCount' },
          minMessages: { $min: '$messageCount' }
        }
      }
    ]).toArray();
    
    res.json(conversationStats[0] || {});
  } catch (error) {
    console.error('Error in conversation stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get popular conversation topics (from conversation titles)
app.get('/api/analytics/topics', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  
  try {
    const topics = await conversationsCollection.aggregate([
      { 
        $match: { 
          title: { $exists: true, $ne: null, $ne: '' }
        } 
      },
      { 
        $group: { 
          _id: '$title',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      { 
        $project: { 
          topic: '$_id',
          count: 1,
          _id: 0 
        } 
      }
    ]).toArray();
    
    res.json(topics);
  } catch (error) {
    console.error('Error in topics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent conversations with titles
app.get('/api/conversations/recent', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  
  try {
    const conversations = await conversationsCollection
      .find({ title: { $exists: true, $ne: null } })
      .project({ title: 1, createdAt: 1, model: 1, endpoint: 1, _id: 0 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching recent conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get model usage statistics
app.get('/api/analytics/models', async (req, res) => {
  try {
    const modelStats = await conversationsCollection.aggregate([
      { 
        $match: { 
          model: { $exists: true, $ne: null }
        } 
      },
      { 
        $group: { 
          _id: '$model',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { 
        $project: { 
          model: '$_id',
          count: 1,
          _id: 0 
        } 
      }
    ]).toArray();
    
    res.json(modelStats);
  } catch (error) {
    console.error('Error in model stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: Open dashboard.html in your browser`);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await client.close();
  process.exit(0);
});

