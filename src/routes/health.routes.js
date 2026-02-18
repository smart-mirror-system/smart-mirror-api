const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

/**
 * ===============================
 * LIVENESS CHECK  (/health)
 * ===============================
 * Purpose:
 * - Confirms the server process is running and not crashed.
 * - If this fails, Kubernetes will restart the container.
 */
router.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});


/**
 * ===============================
 * READINESS CHECK  (/ready)
 * ===============================
 * Purpose:
 * - Confirms the application is ready to receive traffic.
 * - Checks critical dependencies like:
 *    1) Database connection
 *    2) AI model loading (future step)
 *
 * If this fails:
 * - Kubernetes stops sending traffic
 * - BUT does NOT restart the container
 */
router.get("/ready", async (req, res) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database not connected");
    }

    // Future: check AI model readiness here
    // if (!aiModelLoaded) throw new Error("AI model not loaded");

    res.status(200).json({ status: "READY" });
  } catch (err) {
    res.status(500).json({
      status: "NOT_READY",
      reason: err.message,
    });
  }
});

module.exports = router;
