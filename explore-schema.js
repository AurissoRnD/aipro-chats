// Script to explore MongoDB schema
const { MongoClient } = require('mongodb');
require('dotenv').config();

// You'll need to provide your MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

async function exploreSchema() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('chatgpt_aipro');
    
    // Get all collections
    const collections = ['conversations', 'messages', 'pluginauths', 'presets', 'prompts', 'tokens', 'users'];
    
    for (const collectionName of collections) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 Collection: ${collectionName}`);
      console.log('='.repeat(60));
      
      const collection = db.collection(collectionName);
      
      // Get count
      const count = await collection.countDocuments();
      console.log(`📊 Total documents: ${count.toLocaleString()}\n`);
      
      // Get sample document
      const sample = await collection.findOne({});
      if (sample) {
        console.log('📄 Sample document structure:');
        console.log(JSON.stringify(sample, null, 2));
        
        // Show field types
        console.log('\n📝 Field names and types:');
        Object.entries(sample).forEach(([key, value]) => {
          const type = Array.isArray(value) ? 'Array' : typeof value;
          const valuePreview = typeof value === 'string' && value.length > 50 
            ? value.substring(0, 50) + '...' 
            : value;
          console.log(`  - ${key}: ${type}`);
        });
      } else {
        console.log('⚠️  Collection is empty');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

exploreSchema();

