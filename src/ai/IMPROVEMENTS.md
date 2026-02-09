# AI Agent Improvements Documentation

This document describes the implemented improvements for the AI Agent system, organized by priority.

## Table of Contents

- [High Priority](#high-priority)
  - [Agent Cache](#agent-cache)
  - [Rate Limiting](#rate-limiting)
- [Medium Priority](#medium-priority)
  - [Conversation Memory](#conversation-memory)
  - [Missing Tools](#missing-tools)
- [Low Priority](#low-priority)
  - [Multi-models Support](#multi-models-support)
  - [Observability](#observability)

---

## High Priority

### Agent Cache

**Location:** [`src/ai/services/redis-cache.service.ts`](src/ai/services/redis-cache.service.ts)

**Purpose:** Improve performance by caching AI agents to avoid reinitialization.

**Features:**
- Redis-based distributed cache
- TTL-based expiration (default: 5 minutes)
- Automatic cleanup of expired entries
- Singleton pattern per tenant
- Statistics tracking

**Configuration:**
```typescript
// Default configuration
{
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  keyPrefix: 'ai:cache:',
  defaultTTL: 5 * 60 * 1000 // 5 minutes
}
```

**Usage:**
```typescript
import { getRedisCacheService } from './services/redis-cache.service';

const cache = getRedisCacheService();
await cache.set('key', data, 60000); // 1 minute TTL
const value = await cache.get('key');
```

---

### Rate Limiting

**Location:** [`src/ai/services/rate-limiter.service.ts`](src/ai/services/rate-limiter.service.ts)

**Purpose:** Protect the AI API from abuse and ensure fair usage.

**Features:**
- Redis-backed sliding window rate limiting
- Configurable limits (default: 10 requests/minute)
- Atomic operations using Lua scripts
- Precise rate limiting with milliseconds granularity
- Headers with remaining requests and reset time

**Configuration:**
```typescript
const config = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: 'ai:ratelimit:'
};
```

**Response Format:**
```json
{
  "allowed": true,
  "remaining": 5,
  "resetAt": 1699900000000,
  "retryAfter": 30  // seconds if rate limited
}
```

**Usage:**
```typescript
import { getRateLimiterService } from './services/rate-limiter.service';

const rateLimiter = getRateLimiterService();
const result = await rateLimiter.checkRateLimit('user:123');

if (!result.allowed) {
  throw new Error(`Rate limited. Retry after ${result.retryAfter} seconds`);
}
```

---

## Medium Priority

### Conversation Memory

**Location:** [`src/ai/services/conversation-memory.service.ts`](src/ai/services/conversation-memory.service.ts)

**Purpose:** Maintain conversation context across multiple requests.

**Features:**
- Redis-based conversation storage
- Configurable message history limits
- Token estimation for context management
- Automatic trimming of old messages
- Per-conversation and per-user indexing

**Configuration:**
```typescript
const config = {
  maxMessages: 20,
  maxTokens: 8000,
  ttlHours: 24,
  keyPrefix: 'ai:conversation:'
};
```

**Usage:**
```typescript
import { getConversationMemoryService } from './services/conversation-memory.service';

const memory = getConversationMemoryService();

// Create conversation
const conversation = await memory.createConversation(userId, tenantId, 'My Chat');

// Add messages
await memory.addUserMessage(conversation.id, userId, tenantId, 'Hello');
await memory.addAssistantMessage(conversation.id, userId, tenantId, 'Hi there!');

// Get history for AI
const history = memory.formatHistory(conversation);
```

---

### Missing Tools

**Location:** [`src/ai/tools/additional-tools.ts`](src/ai/tools/additional-tools.ts)

**Purpose:** Extend AI capabilities with additional tools.

**Available Tools:**

| Tool Name | Description |
|-----------|-------------|
| `search_company` | Search companies by name, SIREN, or SIRET |
| `list_companies` | List all accessible companies |
| `search_addresses_by_postal_code` | Search addresses by postal code |
| `search_addresses_by_city` | Search addresses by city ID |
| `search_cities` | Search cities by name |
| `search_cities_by_postal_code` | Search cities by postal code |
| `get_simple_stats` | Get simple analytics metrics |

**Usage in Grappe Tools:**
```typescript
import { createAdditionalTools } from './tools/additional-tools';

const tools = createAdditionalTools(
  companyService,
  addressService,
  cityService,
  tenantId,
  userId,
);
```

---

## Low Priority

### Multi-models Support

**Location:** [`src/ai/services/multi-model.service.ts`](src/ai/services/multi-model.service.ts)

**Purpose:** Provide resilience by supporting multiple AI providers.

**Features:**
- Support for Google Gemini, OpenAI GPT, Anthropic Claude
- Automatic fallback on failure
- Health monitoring per provider
- Latency-based model selection
- Configurable model per request

**Available Models:**

| Provider | Model | Context | Capabilities |
|----------|-------|---------|--------------|
| Google | gemini-2.5-flash-lite | 1M | text, streaming, function-calling |
| Google | gemini-2.5-pro | 2M | text, streaming, function-calling, vision |
| OpenAI | gpt-4o | 128K | text, streaming, function-calling, vision |
| OpenAI | gpt-4o-mini | 128K | text, streaming, function-calling |
| Anthropic | claude-sonnet-4 | 200K | text, streaming, function-calling, vision |
| Anthropic | claude-haiku-3 | 200K | text, streaming |

**Configuration:**
```typescript
// Environment variables
GOOGLE_API_KEY=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...

GOOGLE_MODEL=gemini-2.5-flash-lite
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_MODEL=claude-haiku-3-20250514
```

**Usage:**
```typescript
import { getMultiModelService, AVAILABLE_MODELS } from './services/multi-model.service';

const multiModel = getMultiModelService();

// Get available models
const models = multiModel.getAvailableModels();

// Switch to a different model
multiModel.switchModel('gpt-4o-mini');

// Execute with automatic fallback
const result = await multiModelModel.executeWithFallback(
  async (config) => {
    // Your AI call here
    return callAI(config);
  },
  2  // max retries
);
```

---

### Observability

**Location:** [`src/ai/services/observability.service.ts`](src/ai/services/observability.service.ts)

**Purpose:** Monitor and debug AI agent performance.

**Features:**
- Structured logging (JSON format)
- Custom metrics recording
- Distributed tracing with spans
- Prometheus metrics export
- Usage statistics

**Available Metrics:**

| Metric | Description |
|--------|-------------|
| `ai.chat.request.count` | Number of chat requests |
| `ai.chat.request.duration` | Request processing time |
| `ai.rate_limit.hit` | Rate limit hits |
| `ai.cache.hit` | Cache hits/misses |
| `ai.model.switch` | Model switches |
| `ai.tool.call.count` | Tool invocations |
| `ai.tool.call.duration` | Tool execution time |

**Usage:**
```typescript
import { getObservabilityService } from './services/observability.service';

const observability = getObservabilityService();

// Record a metric
observability.recordMetric('ai.chat.request.duration', 1500, { success: 'true' });

// Start a span for tracing
const spanId = observability.startSpan('ai.process');
// ... do work ...
observability.endSpan(spanId, 'ok');

// Structured logging
observability.log('info', 'User requested help', { topic: 'billing' }, { userId, tenantId });

// Export Prometheus metrics
const prometheusMetrics = observability.exportPrometheusMetrics();

// Get usage statistics
const stats = observability.getUsageStats();
```

**Log Format:**
```json
{
  "timestamp": "2025-02-09T10:00:00.000Z",
  "level": "INFO",
  "service": "ai-agent",
  "environment": "production",
  "message": "User requested help",
  "userId": "user123",
  "tenantId": "tenant456",
  "context": { "topic": "billing" }
}
```

---

## Configuration

### Environment Variables

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
AI_RATE_LIMIT_MAX=10
AI_RATE_LIMIT_WINDOW_MS=60000

# Models
GOOGLE_API_KEY=
GOOGLE_MODEL=gemini-2.5-flash-lite
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-3-20250514

# Observability
NODE_ENV=development
```

---

## Files Created

```
src/ai/services/
├── index.ts
├── redis-cache.service.ts
├── rate-limiter.service.ts
├── conversation-memory.service.ts
├── multi-model.service.ts
└── observability.service.ts

src/ai/tools/
└── additional-tools.ts

src/ai/
└── IMPROVEMENTS.md
```

---

## Migration Notes

1. **Redis Required:** All new services require a Redis connection. Ensure Redis is available in your infrastructure.

2. **Fallback to In-Memory:** If Redis is unavailable, services will fail open (allow operations) with degraded functionality.

3. **Breaking Changes:** None. All implementations are additive and backward compatible.

4. **Performance:** Initial connection to Redis may add 10-50ms latency. Connection pooling handles concurrent requests efficiently.

---

## Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Check linting
npm run lint
```
