import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});

// Message schema validation
const messageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(parseInt(process.env.MAX_MESSAGE_LENGTH) || 500, 'Message is too long')
});

// Store recent messages (in-memory storage)
const messageHistory = [];
const MAX_HISTORY = 100;

// Logger middleware
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Log response
  const originalSend = res.send;
  res.send = function (body) {
    console.log(`[${timestamp}] Response:`, typeof body === 'string' ? body : JSON.stringify(body, null, 2));
    console.log('----------------------------------------');
    return originalSend.call(this, body);
  };
  
  next();
};

app.use(cors());
app.use(express.json());
app.use(limiter);
app.use(requestLogger);

// Validation middleware
const validateMessage = (req, res, next) => {
  try {
    messageSchema.parse(req.body);
    next();
  } catch (error) {
    console.error('[Validation Error]:', error.errors);
    next({ type: 'validation', errors: error.errors });
  }
};

app.get('/', (req, res) => {
  console.log('[Event] Root endpoint accessed');
  res.json({ 
    message: 'Server is running',
    endpoints: {
      'POST /message': 'Send a message',
      'GET /messages': 'Get message history'
    }
  });
});

app.post('/message', validateMessage, (req, res) => {
  const { message } = req.body;
  const timestamp = new Date();
  
  console.log('[Event] New message received:', {
    message,
    timestamp: timestamp.toISOString(),
    clientIP: req.ip,
    userAgent: req.get('user-agent')
  });
  
  const response = {
    id: Date.now(),
    received: message,
    serverResponse: `Server processed: ${message} at ${timestamp.toLocaleTimeString()}`,
    timestamp
  };

  // Add to history and maintain max size
  messageHistory.unshift(response);
  if (messageHistory.length > MAX_HISTORY) {
    console.log('[Event] Message history truncated, removed oldest message');
    messageHistory.pop();
  }

  console.log('[Event] Message processed successfully');
  res.json(response);
});

app.get('/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  console.log('[Event] Message history requested', {
    limit,
    totalMessages: messageHistory.length,
    returnedMessages: Math.min(limit, messageHistory.length)
  });
  
  res.json(messageHistory.slice(0, limit));
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('----------------------------------------');
  console.log(`[${new Date().toISOString()}] Server started`);
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Environment variables loaded:');
  console.log('- PORT:', PORT);
  console.log('- RATE_LIMIT_WINDOW_MS:', process.env.RATE_LIMIT_WINDOW_MS || '60000 (default)');
  console.log('- RATE_LIMIT_MAX_REQUESTS:', process.env.RATE_LIMIT_MAX_REQUESTS || '100 (default)');
  console.log('- MAX_MESSAGE_LENGTH:', process.env.MAX_MESSAGE_LENGTH || '500 (default)');
  console.log('----------------------------------------');
});
