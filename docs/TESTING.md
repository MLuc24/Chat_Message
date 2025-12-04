# 🧪 Testing Guide

## Unit Tests

### Auth Service

```bash
cd auth-service
npm test
```

**Test coverage:**
- ✅ User registration
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Token refresh
- ✅ Logout

### User Service

```bash
cd user-service
npm test
```

**Test coverage:**
- ✅ Get user profile
- ✅ Update profile
- ✅ Search users
- ✅ Online/offline tracking

### Chat Service

```bash
cd chat-service
npm test
```

**Test coverage:**
- ✅ Create conversation
- ✅ Send message
- ✅ Get messages with pagination
- ✅ Edit/delete message
- ✅ Message status updates

---

## Integration Tests

### Test Flow

```bash
# 1. Start all services
docker-compose up -d

# 2. Wait for services to be ready
sleep 10

# 3. Run integration tests
npm run test:integration
```

### Sample Test Script

```javascript
const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:8000/api';
const WS_URL = 'http://localhost:9000';

async function testFullFlow() {
  // 1. Register user
  const registerRes = await axios.post(`${API_URL}/auth/register`, {
    email: 'test@example.com',
    password: 'Test123!',
    name: 'Test User'
  });
  
  const { accessToken, user } = registerRes.data;
  console.log('✅ User registered');

  // 2. Create conversation
  const convRes = await axios.post(
    `${API_URL}/chat/conversations`,
    {
      type: 'direct',
      participantIds: [user.id, 'other-user-id']
    },
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  
  const conversation = convRes.data;
  console.log('✅ Conversation created');

  // 3. Connect to WebSocket
  const socket = io(WS_URL);
  
  socket.on('connect', () => {
    console.log('✅ WebSocket connected');
    
    // Authenticate
    socket.emit('authenticate', { token: accessToken });
  });

  socket.on('authenticated', () => {
    console.log('✅ WebSocket authenticated');
    
    // Join conversation
    socket.emit('join_conversation', {
      conversationId: conversation.id
    });
  });

  socket.on('message_new', (message) => {
    console.log('✅ Received message:', message);
  });

  // 4. Send message via API
  await axios.post(
    `${API_URL}/chat/conversations/${conversation.id}/messages`,
    {
      type: 'text',
      text: 'Hello from test!'
    },
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  
  console.log('✅ Message sent');
}

testFullFlow().catch(console.error);
```

---

## Load Testing

### Using Artillery

**Install:**
```bash
npm install -g artillery
```

**Create test config (artillery.yml):**
```yaml
config:
  target: 'http://localhost:8000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Sustained load

scenarios:
  - name: "User flow"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "Test123!"
          capture:
            - json: "$.accessToken"
              as: "token"
      
      - get:
          url: "/api/chat/conversations"
          headers:
            Authorization: "Bearer {{ token }}"
      
      - think: 2
      
      - post:
          url: "/api/chat/conversations/{{ conversationId }}/messages"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            type: "text"
            text: "Load test message"
```

**Run test:**
```bash
artillery run artillery.yml
```

---

## Manual Testing Checklist

### Auth Flow
- [ ] Register new user
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Refresh access token
- [ ] Logout

### User Management
- [ ] Get user profile
- [ ] Update profile
- [ ] Upload avatar
- [ ] Search users

### Conversations
- [ ] Create direct conversation
- [ ] Create group conversation
- [ ] Get all conversations
- [ ] Update group name
- [ ] Add member to group
- [ ] Remove member from group

### Messages
- [ ] Send text message
- [ ] Send image
- [ ] Send video
- [ ] Send file
- [ ] Edit message
- [ ] Delete message
- [ ] Mark as delivered
- [ ] Mark as seen
- [ ] Get message history
- [ ] Pagination works

### Real-time
- [ ] Connect to WebSocket
- [ ] Authenticate via socket
- [ ] Receive new messages
- [ ] Typing indicators work
- [ ] Online/offline presence
- [ ] Message status updates

### Edge Cases
- [ ] Invalid token returns 401
- [ ] Rate limiting works
- [ ] Large file upload (>10MB)
- [ ] Long message (>10000 chars)
- [ ] Concurrent message sending
- [ ] Network interruption recovery

---

## Performance Benchmarks

### Expected Performance

**API Response Times:**
- Auth: < 200ms
- User queries: < 100ms
- Message send: < 150ms
- Message fetch: < 200ms

**WebSocket:**
- Connection time: < 100ms
- Message delivery: < 50ms

**Database:**
- User lookup: < 10ms
- Message insert: < 20ms
- Conversation query: < 30ms

**Resource Usage (per 1000 users):**
- CPU: < 30%
- Memory: < 512MB
- Redis memory: < 100MB
- PostgreSQL: < 200MB

---

## Continuous Integration

### GitHub Actions (.github/workflows/test.yml)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd auth-service && npm ci
          cd ../user-service && npm ci
          cd ../chat-service && npm ci
      
      - name: Run tests
        run: |
          cd auth-service && npm test
          cd ../user-service && npm test
          cd ../chat-service && npm test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
```
