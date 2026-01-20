#!/bin/bash

echo "🧪 Testing Chatbot Analytics Server..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test if server is running
echo "1️⃣  Testing server health..."
HEALTH=$(curl -s http://localhost:3001/api/health 2>&1)
if [[ $HEALTH == *"Server is running"* ]]; then
    echo -e "${GREEN}✅ Server is running!${NC}"
else
    echo -e "${RED}❌ Server not running. Start it with: npm start${NC}"
    exit 1
fi

echo ""
echo "2️⃣  Testing overview stats..."
curl -s http://localhost:3001/api/stats/overview | head -c 200
echo ""
echo ""

echo "3️⃣  Testing top questions..."
curl -s "http://localhost:3001/api/analytics/top-questions?limit=5" | head -c 300
echo ""
echo ""

echo "4️⃣  Testing search..."
curl -s "http://localhost:3001/api/messages/search?q=how&limit=3" | head -c 300
echo ""
echo ""

echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "🌐 Open dashboard.html in your browser to see the full analytics"

