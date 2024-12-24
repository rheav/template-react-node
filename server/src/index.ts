import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { errorHandler } from './middleware/errorHandler.js';
import prisma from './lib/prisma.js';

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

// Create a new message
app.post('/message', validateMessage, async (req, res) => {
  try {
    const { message } = req.body;
    
    console.log('[Event] New message received:', {
      message,
      timestamp: new Date().toISOString(),
      clientIP: req.ip,
      userAgent: req.get('user-agent')
    });
    
    // Save message to database
    const savedMessage = await prisma.message.create({
      data: {
        content: message
      }
    });

    console.log('[Event] Message saved to database:', savedMessage);
    res.json(savedMessage);
  } catch (error) {
    console.error('[Database Error]:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Get all messages
app.get('/messages', async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(messages);
  } catch (error) {
    console.error('[Database Error]:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get a single message by ID
app.get('/message/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const message = await prisma.message.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json(message);
  } catch (error) {
    console.error('[Database Error]:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Delete a message
app.delete('/message/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.message.delete({
      where: {
        id: parseInt(id)
      }
    });
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('[Database Error]:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

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