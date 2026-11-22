const { body, param } = require("express-validator");

const addToWishlistValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid product ID"),
];

const removeFromWishlistValidator = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
];

module.exports = {
  addToWishlistValidator,
  removeFromWishlistValidator,
};
