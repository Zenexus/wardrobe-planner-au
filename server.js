import express from "express";
import cors from "cors";
import { config } from "dotenv";
import emailHandler from "./api/send-email.ts";

// Load environment variables from .env.local
config({ path: ".env.local" });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/api/send-email", async (req, res) => {
  await emailHandler(req, res);
});

// Simple test endpoint
app.get("/health", (req, res) => {
  res.json({
    message: "Email API server is running!",
    env: {
      EMAIL_USER: process.env.EMAIL_USER ? "✓ Set" : "✗ Not set",
      EMAIL_PASS: process.env.EMAIL_PASS ? "✓ Set" : "✗ Not set",
    },
  });
});

app.listen(PORT, () => {
  console.log(`Email API server is running on port ${PORT}`);
});
