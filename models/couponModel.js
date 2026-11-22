const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Coupon name is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, "Coupon name is too short"],
      maxlength: [30, "Coupon name is too long"],
    },
    discount: {
      type: Number,
      required: [true, "Coupon discount is required"],
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100"],
    },
    expire: {
      type: Date,
      required: [true, "Coupon expiry date is required"],
    },
    usageLimit: {
      type: Number,
      default: null,
      min: [1, "Usage limit must be at least 1"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

couponSchema.methods.isValid = function () {
  return (
    this.active &&
    this.expire.getTime() > Date.now() &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
};

const couponModel = mongoose.model("Coupon", couponSchema);

module.exports = { couponModel };
