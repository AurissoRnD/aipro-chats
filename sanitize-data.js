#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Patterns to redact
const patterns = [
  /sk-proj-[a-zA-Z0-9_-]{100,}/g,  // OpenAI API keys
  /sk-[a-zA-Z0-9]{48}/g,             // Older OpenAI format
  /Bearer sk-[a-zA-Z0-9_-]+/g,       // Bearer tokens
];

// Function to sanitize text
function sanitize(text) {
  let cleaned = text;
  patterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '[REDACTED_API_KEY]');
  });
  return cleaned;
}

// Process all JSON files in data/ folder
const dataDir = path.join(__dirname, 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

console.log('🧹 Sanitizing data files...\n');

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  console.log(`Processing: ${file}`);
  
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let originalStr = JSON.stringify(data);
  let sanitizedStr = sanitize(originalStr);
  
  if (originalStr !== sanitizedStr) {
    console.log(`  ✓ Redacted sensitive data`);
    fs.writeFileSync(filePath, sanitizedStr, 'utf8');
  } else {
    console.log(`  - No sensitive data found`);
  }
});

console.log('\n✅ Sanitization complete!');
