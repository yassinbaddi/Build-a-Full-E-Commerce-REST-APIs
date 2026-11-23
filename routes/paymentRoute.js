const express = require("express");
const router = express.Router();

const { protect } = require("../services/authService.js");

router.get("/config", protect, (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      currency: (process.env.CURRENCY || "usd").toLowerCase(),
      methods: ["cash", "stripe", "paypal"],
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      paypal: {
        enabled: Boolean(
          process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET,
        ),
        clientId: process.env.PAYPAL_CLIENT_ID || null,
        environment: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",
      },
    },
  });
});

module.exports = router;
