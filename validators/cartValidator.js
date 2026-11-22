const { body, param } = require("express-validator");

const addToCartValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
];

const updateCartItemValidator = [
  param("productId").isMongoId().withMessage("Invalid product ID"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),
];

const removeCartItemValidator = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
];

const applyCouponValidator = [
  body("coupon")
    .notEmpty()
    .withMessage("Coupon name is required")
    .bail()
    .isString()
    .withMessage("Coupon must be a string")
    .bail()
    .trim(),
];

module.exports = {
  addToCartValidator,
  updateCartItemValidator,
  removeCartItemValidator,
  applyCouponValidator,
};
