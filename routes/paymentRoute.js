const express = require("express");
const {
  createCheckoutSession,
} = require("../services/paymentService");

const router = express.Router();

router.post("/create-checkout-session", async (req, res, next) => {
  try {
    const {
      amount,
      currency,
      productName,
      quantity,
    } = req.body;

    const session = await createCheckoutSession({
      amount,
      currency,
      productName,
      quantity,
    });

    return res.status(201).json({
      success: true,
      message: "Checkout session created successfully",
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
