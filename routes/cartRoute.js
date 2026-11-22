const express = require("express");
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
} = require("../services/cartService.js");

const { protect } = require("../services/authService.js");
const validate = require("../middleware/validateMiddleware.js");

const {
  addToCartValidator,
  updateCartItemValidator,
  removeCartItemValidator,
  applyCouponValidator,
} = require("../validators/cartValidator.js");

router.get("/", protect, getCart);

router.post("/", protect, addToCartValidator, validate, addToCart);

router.put(
  "/:productId",
  protect,
  updateCartItemValidator,
  validate,
  updateCartItem,
);

router.delete(
  "/:productId",
  protect,
  removeCartItemValidator,
  validate,
  removeFromCart,
);

router.delete("/", protect, clearCart);

router.post(
  "/apply-coupon",
  protect,
  applyCouponValidator,
  validate,
  applyCoupon,
);

router.delete("/coupon/remove", protect, removeCoupon);

module.exports = { router };
