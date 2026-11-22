const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "Users",
      required: true,
    },
    alias: {
      type: String,
      trim: true,
      maxlength: [30, "Address alias is too long"],
    },
    details: {
      type: String,
      required: [true, "Address details are required"],
      trim: true,
      minlength: [5, "Address details are too short"],
      maxlength: [200, "Address details are too long"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const addressModel = mongoose.model("Address", addressSchema);

module.exports = { addressModel };
