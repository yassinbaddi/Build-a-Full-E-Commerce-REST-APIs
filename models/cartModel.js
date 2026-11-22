const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "Quantity must be at least 1"],
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "Users",
      required: true,
      unique: true,
    },
    cartItems: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
    totalPriceAfterDiscount: {
      type: Number,
      default: 0,
    },
    coupon: {
      type: mongoose.Schema.ObjectId,
      ref: "Coupon",
    },
  },
  { timestamps: true },
);

const cartModel = mongoose.model("Cart", cartSchema);

module.exports = { cartModel };
