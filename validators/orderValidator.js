const { body, param } = require("express-validator");

const createOrderValidator = [
  body("addressId")
    .notEmpty()
    .withMessage("Shipping address is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid address ID"),

  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .bail()
    .isIn(["cash", "stripe", "paypal"])
    .withMessage("Payment method must be cash, stripe or paypal"),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .bail()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must be at most 500 characters"),
];

const orderIdValidator = [
  param("id").isMongoId().withMessage("Invalid order ID"),
];

const updateOrderStatusValidator = [
  ...orderIdValidator,

  body("orderStatus")
    .notEmpty()
    .withMessage("Order status is required")
    .bail()
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid order status"),
];

const listOrdersValidator = [
  param("id").optional().isMongoId().withMessage("Invalid order ID"),

  body("status")
    .optional()
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid order status"),
];

module.exports = {
  createOrderValidator,
  orderIdValidator,
  updateOrderStatusValidator,
  listOrdersValidator,
};
