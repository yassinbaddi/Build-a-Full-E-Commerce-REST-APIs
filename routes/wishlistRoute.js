const express = require("express");
const router = express.Router();

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = require("../services/wishlistService.js");

const { protect } = require("../services/authService.js");
const validate = require("../middleware/validateMiddleware.js");

const {
  addToWishlistValidator,
  removeFromWishlistValidator,
} = require("../validators/wishlistValidator.js");

router.get("/", protect, getWishlist);

router.post(
  "/",
  protect,
  addToWishlistValidator,
  validate,
  addToWishlist,
);

router.delete(
  "/:productId",
  protect,
  removeFromWishlistValidator,
  validate,
  removeFromWishlist,
);

router.delete("/", protect, clearWishlist);

module.exports = { router };
