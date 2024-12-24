import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
});

// Message schema validation
const messageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(
      parseInt(process.env.MAX_MESSAGE_LENGTH || "500"),
      "Message is too long"
    ),
});

type MessageBody = z.infer<typeof messageSchema>;

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);

// API Routes
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.post("/message", async (req, res) => {
  try {
    const { message } = messageSchema.parse(req.body);
    const newMessage = await prisma.message.create({
      data: { content: message },
    });
    res.json(newMessage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.get("/messages", async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Error handling
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something broke!" });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
