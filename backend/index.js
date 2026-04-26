// index.js - Main server file
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const birthChartRoutes = require("./routes/birthChart");
const matchRoutes = require("./routes/match");
const horoscopeRoutes = require("./routes/horoscope");
const { getAvailableModel, modelStatus, SUPPORTED_MODELS } = require("./utils/gemini");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React frontend
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Health check
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ 
    status: "Astrology API running ✨",
    geminiConfigured: hasKey,
    environment: process.env.NODE_ENV || "unknown"
  });
});

// Diagnostics endpoint
app.get("/api/diagnostics", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    geminiApiKeyPresent: hasKey,
    geminiApiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
    supportedModels: SUPPORTED_MODELS,
    modelStatus: modelStatus,
    timestamp: new Date().toISOString()
  });
});

// Model status endpoint
app.get("/api/models/status", (req, res) => {
  const currentModel = getAvailableModel();
  const status = {
    currentModel,
    supportedModels: SUPPORTED_MODELS,
    modelStatus: modelStatus,
    timestamp: new Date().toISOString()
  };
  res.json(status);
});

// Routes
app.use("/api/birth-chart", birthChartRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/horoscope", horoscopeRoutes);

// Serve React app for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

// Use Railway's PORT or fallback to 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌟 Astrology backend running on port ${PORT}`);
});
