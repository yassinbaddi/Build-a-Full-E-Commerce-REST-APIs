const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 200,
    },
    quantity: {
      type: Number,
      required: true,
    },
    sold: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      trim: true,
      max: 200000,
    },
    priceAfterDiscount: {
      type: Number,
    },
    colors: {
      type: [String],
    },
    images: {
      type: [String],
    },
    imageCover: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "SubCategory",
      },
    ],
    brand: {
      type: String,
    },
    retingsAverage: {
      type: Number,
      min: 1,
      max: 5,
    },
    retingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const productModel = mongoose.model("Product", productSchema);

module.exports = productModel;
