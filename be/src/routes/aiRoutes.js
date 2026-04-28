const express = require("express");
const geminiChatbotService = require("../services/chatbot/geminiChatbot.service");
const { catchAsync } = require("../utils/catchAsync");

const router = express.Router();

// Endpoint to check AI service status
router.get(
  "/status",
  catchAsync(async (req, res) => {
    const isReady = !!geminiChatbotService.model;
    const hasApiKey =
      !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "demo-key";

    res.status(200).json({
      status: "success",
      data: {
        isReady,
        hasApiKey,
        message: isReady
          ? "AI chat service is ready."
          : "AI chat service is not initialized or API key is missing.",
      },
    });
  })
);

// Endpoint to handle AI chat messages
router.post(
  "/chat",
  catchAsync(async (req, res) => {
    const { message, context } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ status: "fail", message: "Message is required." });
    }

    const aiResponse = await geminiChatbotService.handleMessage(
      message,
      context
    );

    res.status(200).json({ status: "success", data: aiResponse });
  })
);

module.exports = router;
