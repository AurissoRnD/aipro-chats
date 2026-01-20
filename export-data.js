#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

// Date range: 11.11.2024 to 11.11.2025
const START_DATE = new Date('2024-11-11T00:00:00.000Z');
const END_DATE = new Date('2025-11-11T23:59:59.999Z');

console.log('📅 Exporting data from', START_DATE.toISOString(), 'to', END_DATE.toISOString());

async function exportData() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('chatgpt_aipro');
    const messagesCollection = db.collection('messages');
    const conversationsCollection = db.collection('conversations');
    
    // Create data directory
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    
    console.log('📊 Exporting overview statistics...');
    
    // 1. Overview statistics
    const totalMessages = await messagesCollection.countDocuments({
      createdAt: { $gte: START_DATE, $lte: END_DATE }
    });
    
    const totalUserMessages = await messagesCollection.countDocuments({
      createdAt: { $gte: START_DATE, $lte: END_DATE },
      isCreatedByUser: true
    });
    
    const totalConversations = await conversationsCollection.countDocuments({
      createdAt: { $gte: START_DATE, $lte: END_DATE }
    });
    
    const oldestMessage = await messagesCollection.findOne(
      { createdAt: { $gte: START_DATE, $lte: END_DATE } },
      { sort: { createdAt: 1 } }
    );
    
    const newestMessage = await messagesCollection.findOne(
      { createdAt: { $gte: START_DATE, $lte: END_DATE } },
      { sort: { createdAt: -1 } }
    );
    
    const overview = {
      totalMessages,
      totalUserMessages,
      totalConversations,
      dateRange: {
        start: oldestMessage?.createdAt,
        end: newestMessage?.createdAt
      }
    };
    
    fs.writeFileSync(
      path.join(dataDir, 'overview.json'),
      JSON.stringify(overview, null, 2)
    );
    console.log(`✅ Overview: ${totalMessages} messages, ${totalUserMessages} user messages`);
    
    // 1b. User statistics
    console.log('👥 Exporting user statistics...');
    
    // Total unique users
    const uniqueUsersCount = await conversationsCollection.aggregate([
      { 
        $match: { 
          createdAt: { $gte: START_DATE, $lte: END_DATE }
        } 
      },
      {
        $group: {
          _id: '$user'
        }
      },
      {
        $count: 'totalUsers'
      }
    ]).toArray();
    
    const totalUsers = uniqueUsersCount[0]?.totalUsers || 0;
    
    // Users per day
    const usersPerDay = await conversationsCollection.aggregate([
      { 
        $match: { 
          createdAt: { $gte: START_DATE, $lte: END_DATE }
        } 
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            user: '$user'
          }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          uniqueUsers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { 
        $project: { 
          date: '$_id',
          users: '$uniqueUsers',
          _id: 0 
        } 
      }
    ]).toArray();
    
    // Calculate average users per day
    const avgUsersPerDay = usersPerDay.length > 0
      ? usersPerDay.reduce((sum, day) => sum + day.users, 0) / usersPerDay.length
      : 0;
    
    const userStats = {
      totalUniqueUsers: totalUsers,
      avgUsersPerDay: avgUsersPerDay,
      usersPerDay: usersPerDay
    };
    
    fs.writeFileSync(
      path.join(dataDir, 'user-stats.json'),
      JSON.stringify(userStats, null, 2)
    );
    console.log(`✅ User stats: ${totalUsers.toLocaleString()} unique users, ${avgUsersPerDay.toFixed(0)} avg per day`);
    
    // 2. Top questions
    console.log('❓ Exporting top questions...');
    const topQuestions = await messagesCollection.aggregate([
      { 
        $match: { 
          createdAt: { $gte: START_DATE, $lte: END_DATE },
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
      { $limit: 200 },
      { 
        $project: { 
          question: '$_id',
          count: 1,
          lastAsked: 1,
          _id: 0 
        } 
      }
    ]).toArray();
    
    fs.writeFileSync(
      path.join(dataDir, 'top-questions.json'),
      JSON.stringify(topQuestions, null, 2)
    );
    console.log(`✅ Exported ${topQuestions.length} top questions`);
    
    // 3. Timeline data
    console.log('📈 Exporting timeline...');
    const timeline = await messagesCollection.aggregate([
      { 
        $match: { 
          createdAt: { $gte: START_DATE, $lte: END_DATE },
          isCreatedByUser: true
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
    
    fs.writeFileSync(
      path.join(dataDir, 'timeline.json'),
      JSON.stringify(timeline, null, 2)
    );
    console.log(`✅ Exported ${timeline.length} days of timeline data`);
    
    // 4. Word frequency (for word cloud)
    console.log('☁️  Exporting word frequency data...');
    const wordFreqMessages = await messagesCollection.aggregate([
      { 
        $match: { 
          createdAt: { $gte: START_DATE, $lte: END_DATE },
          isCreatedByUser: true,
          text: { $exists: true, $ne: '', $ne: null }
        } 
      },
      { $sample: { size: 20000 } },
      { $project: { text: 1, _id: 0 } }
    ]).toArray();
    
    fs.writeFileSync(
      path.join(dataDir, 'word-frequency.json'),
      JSON.stringify(wordFreqMessages, null, 2)
    );
    console.log(`✅ Exported ${wordFreqMessages.length} messages for word cloud`);
    
    // 5. Message length distribution
    console.log('📏 Exporting message lengths...');
    const messageLengths = await messagesCollection.aggregate([
      { 
        $match: { 
          createdAt: { $gte: START_DATE, $lte: END_DATE },
          isCreatedByUser: true,
          text: { $exists: true, $ne: '', $ne: null }
        } 
      },
      { $sample: { size: 10000 } },
      { 
        $project: { 
          length: { $strLenCP: '$text' },
          _id: 0 
        } 
      }
    ]).toArray();
    
    fs.writeFileSync(
      path.join(dataDir, 'message-lengths.json'),
      JSON.stringify(messageLengths, null, 2)
    );
    console.log(`✅ Exported ${messageLengths.length} message lengths`);
    
    // 6. Conversation statistics
    console.log('💬 Exporting conversation stats...');
    const conversationStats = await messagesCollection.aggregate([
      { 
        $match: { 
          createdAt: { $gte: START_DATE, $lte: END_DATE },
          isCreatedByUser: true 
        } 
      },
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
    
    fs.writeFileSync(
      path.join(dataDir, 'conversation-stats.json'),
      JSON.stringify(conversationStats[0] || {}, null, 2)
    );
    console.log(`✅ Exported conversation statistics`);
    
    // 7. Popular topics
    console.log('🏷️  Exporting topics...');
    const topics = await conversationsCollection.aggregate([
      { 
        $match: { 
          createdAt: { $gte: START_DATE, $lte: END_DATE },
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
      { $limit: 100 },
      { 
        $project: { 
          topic: '$_id',
          count: 1,
          _id: 0 
        } 
      }
    ]).toArray();
    
    fs.writeFileSync(
      path.join(dataDir, 'topics.json'),
      JSON.stringify(topics, null, 2)
    );
    console.log(`✅ Exported ${topics.length} topics`);
    
    // 8. Model usage statistics
    console.log('🎯 Exporting model stats...');
    const modelStats = await conversationsCollection.aggregate([
      { 
        $match: { 
          createdAt: { $gte: START_DATE, $lte: END_DATE },
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
    
    fs.writeFileSync(
      path.join(dataDir, 'model-stats.json'),
      JSON.stringify(modelStats, null, 2)
    );
    console.log(`✅ Exported model statistics`);
    
    // 9. Export actual conversations with messages
    console.log('💭 Exporting full conversations...');
    
    // Get ALL conversations in date range (NO LIMIT!)
    const conversations = await conversationsCollection
      .find({
        createdAt: { $gte: START_DATE, $lte: END_DATE }
      })
      .sort({ user: 1, createdAt: -1 }) // Sort by user first, then by date
      .toArray(); // NO LIMIT - Get all 2M+ conversations!
    
    console.log(`Found ${conversations.length} conversations`);
    
    // For each conversation, get its messages
    const conversationsWithMessages = [];
    let processedCount = 0;
    
    for (const convo of conversations) {
      const messages = await messagesCollection
        .find({ 
          conversationId: convo.conversationId,
          createdAt: { $gte: START_DATE, $lte: END_DATE }
        })
        .sort({ createdAt: 1 })
        .toArray();
      
      if (messages.length > 0) {
        conversationsWithMessages.push({
          conversationId: convo.conversationId,
          user: convo.user || 'unknown', // Include user for grouping
          title: convo.title || 'Untitled Conversation',
          createdAt: convo.createdAt,
          model: convo.model,
          messageCount: messages.length,
          messages: messages.map(msg => ({
            text: msg.text || msg.content || '',
            sender: msg.sender,
            isCreatedByUser: msg.isCreatedByUser,
            createdAt: msg.createdAt,
            role: msg.role
          }))
        });
      }
      
      processedCount++;
      if (processedCount % 50 === 0) {
        console.log(`  Processed ${processedCount}/${conversations.length} conversations...`);
      }
    }
    
    fs.writeFileSync(
      path.join(dataDir, 'conversations.json'),
      JSON.stringify(conversationsWithMessages, null, 2)
    );
    console.log(`✅ Exported ${conversationsWithMessages.length} full conversations with messages`);
    
    // 10. Create searchable index of all user messages
    console.log('🔍 Creating searchable message index...');
    const allUserMessages = await messagesCollection
      .find({ 
        createdAt: { $gte: START_DATE, $lte: END_DATE },
        isCreatedByUser: true,
        text: { $exists: true, $ne: '', $ne: null }
      })
      .project({ text: 1, createdAt: 1, conversationId: 1, _id: 0 })
      .sort({ createdAt: -1 })
      .limit(10000) // Limit to 10k most recent messages
      .toArray();
    
    fs.writeFileSync(
      path.join(dataDir, 'all-messages.json'),
      JSON.stringify(allUserMessages, null, 2)
    );
    console.log(`✅ Exported ${allUserMessages.length} user messages for search`);
    
    console.log('\n🎉 Export complete! Data saved to ./data/ directory');
    console.log('\n📁 Files created:');
    console.log('  - overview.json');
    console.log('  - user-stats.json (NEW!)');
    console.log('  - top-questions.json');
    console.log('  - timeline.json');
    console.log('  - word-frequency.json');
    console.log('  - message-lengths.json');
    console.log('  - conversation-stats.json');
    console.log('  - topics.json');
    console.log('  - model-stats.json');
    console.log('  - conversations.json (full chats)');
    console.log('  - all-messages.json (for search)');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

exportData();

