import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { errorHandler } from './middleware/errorHandler.js';
import prisma from './lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});

// Message schema validation
const messageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(parseInt(process.env.MAX_MESSAGE_LENGTH || '500'), 'Message is too long')
});

type MessageBody = z.infer<typeof messageSchema>;

// Logger middleware
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Log response
  const originalSend = res.send;
  res.send = function (body: any) {
    console.log(`[${timestamp}] Response:`, typeof body === 'string' ? body : JSON.stringify(body, null, 2));
    console.log('----------------------------------------');
    return originalSend.call(this, body);
  };
  
  next();
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);
app.use(requestLogger);

// Serve static files from the React app
const clientPath = path.resolve(__dirname, '../../client/dist');
console.log('Serving static files from:', clientPath);
app.use(express.static(clientPath));

// Validation middleware
const validateMessage = (req: Request, res: Response, next: NextFunction) => {
  try {
    messageSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Validation Error]:', error.errors);
      next({ type: 'validation', errors: error.errors });
    } else {
      next(error);
    }
  }
};

app.get('/', (req: Request, res: Response) => {
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
app.post('/message', validateMessage, async (req: Request, res: Response) => {
  try {
    const { message } = req.body as MessageBody;
    
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
app.get('/messages', async (req: Request, res: Response) => {
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
app.get('/message/:id', async (req: Request, res: Response) => {
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
app.delete('/message/:id', async (req: Request, res: Response) => {
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

// Handle React routing, return all requests to React app
app.get('*', (req: Request, res: Response) => {
  const indexPath = path.join(clientPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  res.sendFile(indexPath);
});

app.use(errorHandler);

// Start server with enhanced error handling
const startServer = async () => {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log('----------------------------------------');
      console.log(`[${new Date().toISOString()}] Server started`);
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log('Environment variables loaded:');
      console.log(`- PORT: ${PORT}`);
      console.log(`- RATE_LIMIT_WINDOW_MS: ${process.env.RATE_LIMIT_WINDOW_MS || '60000'}`);
      console.log(`- RATE_LIMIT_MAX_REQUESTS: ${process.env.RATE_LIMIT_MAX_REQUESTS || '100'}`);
      console.log(`- MAX_MESSAGE_LENGTH: ${process.env.MAX_MESSAGE_LENGTH || '500'}`);
      console.log('----------------------------------------');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
