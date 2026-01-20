const express = require('express');
const weaviate = require('weaviate-ts-client');
const OpenAI = require('openai');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (dashboard and data)
app.use(express.static(__dirname));
app.use('/data', express.static(path.join(__dirname, 'data')));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Weaviate client
const weaviateClient = weaviate.default.client({
  scheme: 'https',
  host: process.env.WEAVIATE_URL.replace('https://', '').replace('http://', ''),
  apiKey: new weaviate.default.ApiKey(process.env.WEAVIATE_API_KEY),
  headers: {
    'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY
  }
});

// Test Weaviate connection on startup
weaviateClient.schema.getter()
  .do()
  .then(() => console.log('✅ Connected to Weaviate'))
  .catch(err => {
    console.error('❌ Failed to connect to Weaviate:', err.message);
    console.log('⚠️  Chatbot will not work without Weaviate connection');
  });

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Chatbot server is running' });
});

// Chatbot endpoint
app.post('/api/chatbot', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log(`\n🤖 Question: "${question}"`);

    // Search Weaviate for relevant conversations
    const searchResults = await weaviateClient.graphql
      .get()
      .withClassName('Conversation')
      .withFields('conversationId userId title content messageCount createdAt model')
      .withNearText({ concepts: [question] })
      .withLimit(5) // Increased to 5 for better context
      .do();

    if (!searchResults.data || !searchResults.data.Get || !searchResults.data.Get.Conversation) {
      return res.status(500).json({ error: 'No results from vector search' });
    }

    const conversations = searchResults.data.Get.Conversation;
    
    if (conversations.length === 0) {
      return res.json({
        answer: "I couldn't find any relevant conversations about that topic. Could you rephrase your question?",
        sources: []
      });
    }

    console.log(`📊 Found ${conversations.length} relevant conversations`);

    // Build context from top results
    const context = conversations.map((convo, i) => `
CONVERSATION ${i+1}: ${convo.title}
User: ${convo.userId}
Date: ${new Date(convo.createdAt).toLocaleDateString()}
Messages: ${convo.messageCount}

${convo.content.substring(0, 2000)}
${convo.content.length > 2000 ? '...' : ''}
    `).join('\n\n---\n\n');

    // Ask GPT with context
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using 3.5 for cost efficiency
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        { 
          role: "system", 
          content: `You are an analytics assistant helping analyze chatbot conversations from November 2024 to November 2025.

Answer questions based on the actual conversation data provided. Be specific and cite examples when possible.
If the data doesn't clearly answer the question, say so honestly.

RELEVANT CONVERSATIONS:
${context}` 
        },
        { 
          role: "user", 
          content: question 
        }
      ]
    });

    const answer = response.choices[0].message.content;

    console.log(`✅ Answer generated (${response.usage.total_tokens} tokens)`);

    res.json({
      answer,
      sources: conversations.map(c => ({
        title: c.title,
        user: c.userId ? c.userId.substring(0, 30) + '...' : 'unknown', // Truncate for privacy
        messageCount: c.messageCount,
        date: new Date(c.createdAt).toLocaleDateString()
      })),
      tokensUsed: response.usage.total_tokens
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

// Serve dashboard as homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard-static.html'));
});

// Get Weaviate stats
app.get('/api/stats/weaviate', async (req, res) => {
  try {
    const result = await weaviateClient.graphql
      .aggregate()
      .withClassName('Conversation')
      .withFields('meta { count }')
      .do();
    
    const count = result.data?.Aggregate?.Conversation?.[0]?.meta?.count || 0;
    
    res.json({
      conversationsIndexed: count,
      status: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      conversationsIndexed: 0,
      status: 'error',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Chatbot Server Running`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🤖 Chatbot API: http://localhost:${PORT}/api/chatbot`);
  console.log(`\n✨ Open http://localhost:${PORT} in your browser`);
});

