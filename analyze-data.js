#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const START_DATE = new Date('2024-11-11T00:00:00.000Z');
const END_DATE = new Date('2025-11-11T23:59:59.999Z');

async function analyzeData() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('chatgpt_aipro');
    const conversationsCollection = db.collection('conversations');
    const messagesCollection = db.collection('messages');
    
    console.log('📅 Date Range: Nov 11, 2024 - Nov 11, 2025\n');
    console.log('═'.repeat(60));
    
    // 1. Total conversations in date range
    console.log('\n📊 CONVERSATION STATISTICS\n');
    
    const totalConversations = await conversationsCollection.countDocuments({
      createdAt: { $gte: START_DATE, $lte: END_DATE }
    });
    console.log(`Total Conversations: ${totalConversations.toLocaleString()}`);
    
    // 2. Conversations by user
    console.log('\n👥 CONVERSATIONS BY USER:\n');
    const convosByUser = await conversationsCollection.aggregate([
      { 
        $match: { 
          createdAt: { $gte: START_DATE, $lte: END_DATE }
        } 
      },
      {
        $group: {
          _id: '$user',
          conversationCount: { $sum: 1 },
          conversationIds: { $addToSet: '$conversationId' }
        }
      },
      { $sort: { conversationCount: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    convosByUser.forEach((user, i) => {
      console.log(`  ${i + 1}. User: ${user._id || '(unknown)'}`);
      console.log(`     Conversations: ${user.conversationCount.toLocaleString()}`);
    });
    
    // 3. Total unique users (using aggregation to avoid 16MB limit)
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
    console.log(`\nTotal Unique Users: ${totalUsers.toLocaleString()}`);
    
    // 4. Messages per conversation distribution
    console.log('\n💬 MESSAGES PER CONVERSATION:\n');
    const messageStats = await messagesCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: START_DATE, $lte: END_DATE }
        }
      },
      {
        $group: {
          _id: '$conversationId',
          messageCount: { $sum: 1 },
          userMessages: {
            $sum: { $cond: ['$isCreatedByUser', 1, 0] }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          avgMessages: { $avg: '$messageCount' },
          minMessages: { $min: '$messageCount' },
          maxMessages: { $max: '$messageCount' },
          avgUserMessages: { $avg: '$userMessages' }
        }
      }
    ]).toArray();
    
    if (messageStats.length > 0) {
      const stats = messageStats[0];
      console.log(`  Conversations with messages: ${stats.totalConversations.toLocaleString()}`);
      console.log(`  Average messages per convo: ${stats.avgMessages.toFixed(1)}`);
      console.log(`  Average user messages per convo: ${stats.avgUserMessages.toFixed(1)}`);
      console.log(`  Min messages: ${stats.minMessages}`);
      console.log(`  Max messages: ${stats.maxMessages}`);
    }
    
    // 5. Sample size analysis
    console.log('\n📦 SAMPLE SIZE ANALYSIS:\n');
    
    const samples = [500, 1000, 2000, 5000, 10000];
    
    for (const sampleSize of samples) {
      if (sampleSize > totalConversations) break;
      
      const percentage = ((sampleSize / totalConversations) * 100).toFixed(1);
      const estimatedSize = (sampleSize * 20) / 1024; // ~20KB per conversation
      
      console.log(`  ${sampleSize.toLocaleString()} conversations:`);
      console.log(`    → ${percentage}% of total`);
      console.log(`    → ~${estimatedSize.toFixed(0)}MB JSON file`);
      console.log(`    → Search time: ~${sampleSize / 5}ms`);
      console.log('');
    }
    
    // 6. Conversations with most messages (potential high-value convos)
    console.log('\n🔥 TOP 10 CONVERSATIONS BY MESSAGE COUNT:\n');
    const topConvos = await messagesCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: START_DATE, $lte: END_DATE }
        }
      },
      {
        $group: {
          _id: '$conversationId',
          messageCount: { $sum: 1 },
          userMessages: {
            $sum: { $cond: ['$isCreatedByUser', 1, 0] }
          }
        }
      },
      { $sort: { messageCount: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    for (let i = 0; i < topConvos.length; i++) {
      const convo = topConvos[i];
      const convoDetails = await conversationsCollection.findOne({ 
        conversationId: convo._id 
      });
      
      console.log(`  ${i + 1}. ${convoDetails?.title || 'Untitled'}`);
      console.log(`     Total messages: ${convo.messageCount}`);
      console.log(`     User messages: ${convo.userMessages}`);
      console.log('');
    }
    
    // 7. Recommendation
    console.log('═'.repeat(60));
    console.log('\n💡 RECOMMENDATION:\n');
    
    if (totalConversations <= 1000) {
      console.log('  ✅ Use JSON file (no vector DB needed)');
      console.log(`     ${totalConversations} conversations is perfect for in-memory search`);
      console.log('     Fast, simple, free!');
    } else if (totalConversations <= 5000) {
      console.log('  ⚠️  Consider your needs:');
      console.log('     - JSON file: Works fine, ~100-200ms search');
      console.log('     - Vector DB: Overkill but faster (~20ms)');
      console.log(`     - Recommendation: Start with JSON, ${totalConversations} is manageable`);
    } else if (totalConversations <= 20000) {
      console.log('  ⚠️  Getting large:');
      console.log('     - JSON file: Still works but slower (~500ms)');
      console.log('     - Vector DB: Recommended for better UX');
      console.log('     - Free option: Weaviate Cloud');
    } else {
      console.log('  ❌ Vector DB recommended');
      console.log(`     ${totalConversations.toLocaleString()} conversations is too many for JSON`);
      console.log('     Use: Weaviate Cloud (free) or Pinecone');
    }
    
    console.log('\n═'.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

analyzeData();

