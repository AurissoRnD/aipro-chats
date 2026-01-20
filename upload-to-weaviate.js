#!/usr/bin/env node

const weaviate = require('weaviate-ts-client');
const OpenAI = require('openai');
const fs = require('fs');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Weaviate Cloud credentials - you'll get these from weaviate.io
const WEAVIATE_URL = process.env.WEAVIATE_URL || 'https://your-cluster.weaviate.network';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY;

async function uploadToWeaviate() {
  console.log('🚀 Connecting to Weaviate...\n');
  
  const client = weaviate.default.client({
    scheme: 'https',
    host: WEAVIATE_URL.replace('https://', '').replace('http://', ''),
    apiKey: new weaviate.default.ApiKey(WEAVIATE_API_KEY),
    headers: {
      'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY
    }
  });
  
  try {
    // Test connection
    await client.schema.getter().do();
    console.log('✅ Connected to Weaviate!\n');
  } catch (error) {
    console.error('❌ Failed to connect to Weaviate:', error.message);
    console.log('\n💡 Setup Instructions:');
    console.log('   1. Go to https://console.weaviate.cloud');
    console.log('   2. Create a free cluster');
    console.log('   3. Add to .env:');
    console.log('      WEAVIATE_URL=https://your-cluster.weaviate.network');
    console.log('      WEAVIATE_API_KEY=your-api-key');
    process.exit(1);
  }
  
  // Create schema for conversations
  console.log('📋 Creating schema...');
  
  const schemaConfig = {
    class: 'Conversation',
    description: 'A chatbot conversation grouped by user',
    vectorizer: 'text2vec-openai',
    moduleConfig: {
      'text2vec-openai': {
        model: 'ada',
        modelVersion: '002',
        type: 'text'
      }
    },
    properties: [
      {
        name: 'conversationId',
        dataType: ['text'],
        description: 'Unique conversation ID'
      },
      {
        name: 'userId',
        dataType: ['text'],
        description: 'User identifier (email/ID)'
      },
      {
        name: 'title',
        dataType: ['text'],
        description: 'Conversation title'
      },
      {
        name: 'content',
        dataType: ['text'],
        description: 'Full conversation text'
      },
      {
        name: 'createdAt',
        dataType: ['date'],
        description: 'When the conversation was created'
      },
      {
        name: 'messageCount',
        dataType: ['int'],
        description: 'Number of messages in conversation'
      },
      {
        name: 'model',
        dataType: ['text'],
        description: 'AI model used'
      }
    ]
  };
  
  try {
    // Delete existing schema if it exists
    try {
      await client.schema.classDeleter().withClassName('Conversation').do();
      console.log('  Deleted existing schema');
    } catch (e) {
      // Class doesn't exist, that's fine
    }
    
    await client.schema.classCreator().withClass(schemaConfig).do();
    console.log('✅ Schema created!\n');
  } catch (error) {
    console.error('❌ Error creating schema:', error.message);
    process.exit(1);
  }
  
  // Load conversations
  console.log('📚 Loading conversations...');
  const conversations = JSON.parse(
    fs.readFileSync('./data/conversations.json', 'utf-8')
  );
  
  // Upload ALL conversations (no sampling!)
  // Only filter out conversations with no messages
  const goodConvos = conversations
    .filter(c => c.messageCount >= 1) // Must have at least 1 message
    .sort((a, b) => {
      // Sort by user first, then by date
      if (a.user < b.user) return -1;
      if (a.user > b.user) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  
  console.log(`📊 Uploading ALL ${goodConvos.length} conversations!`);
  console.log(`(From ${conversations.length} total)`);
  console.log(`Grouped by user and sorted by date`);
  console.log(`This will take a while... ☕\n`);
  
  // Upload in batches
  console.log('⬆️  Uploading to Weaviate...\n');
  
  let batcher = client.batch.objectsBatcher();
  let counter = 0;
  const batchSize = 100;
  
  for (const convo of goodConvos) {
    // Create content from messages
    const content = `Title: ${convo.title}\n\n${convo.messages
      .map(m => `${m.isCreatedByUser ? 'User' : 'Assistant'}: ${m.text || ''}`)
      .join('\n')}`;
    
    const obj = {
      class: 'Conversation',
      properties: {
        conversationId: convo.conversationId,
        userId: convo.user || 'unknown', // Add user ID for grouping
        title: convo.title || 'Untitled',
        content: content.substring(0, 10000), // Limit for safety
        createdAt: new Date(convo.createdAt).toISOString(),
        messageCount: convo.messageCount,
        model: convo.model || 'unknown'
      }
    };
    
    batcher.withObject(obj);
    counter++;
    
    // Send batch every 100 items
    if (counter % batchSize === 0) {
      await batcher.do();
      const percentage = ((counter / goodConvos.length) * 100).toFixed(1);
      console.log(`  ✅ Uploaded ${counter.toLocaleString()}/${goodConvos.length.toLocaleString()} (${percentage}%)`);
      batcher = client.batch.objectsBatcher();
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Upload remaining
  if (counter % batchSize !== 0) {
    await batcher.do();
    console.log(`  ✅ Uploaded ${counter.toLocaleString()}/${goodConvos.length.toLocaleString()} (100%)`);
  }
  
  console.log('\n🎉 Upload complete!');
  console.log(`\n📊 Uploaded ${counter.toLocaleString()} conversations to Weaviate`);
  console.log(`👥 All conversations grouped by user`);
  console.log(`📅 Sorted by date within each user`);
  console.log('✅ Your chatbot can now search through ALL user conversations!');
  
}

uploadToWeaviate().catch(console.error);

