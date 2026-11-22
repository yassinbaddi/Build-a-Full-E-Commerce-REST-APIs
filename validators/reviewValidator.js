const { body, param } = require("express-validator");

const validateReviewId = [
  param("id").isMongoId().withMessage("Invalid review ID"),
];

const validateProductIdParam = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
];

const reviewFields = [
  body("rating")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .isString()
    .withMessage("Comment must be a string")
    .bail()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage("Comment must be between 3 and 500 characters"),

  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title must be at most 100 characters"),
];

const createReviewValidator = [
  ...validateProductIdParam,
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .bail()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .notEmpty()
    .withMessage("Comment is required")
    .bail()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage("Comment must be between 3 and 500 characters"),

  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title must be at most 100 characters"),
];

const updateReviewValidator = [
  ...validateReviewId,
  ...reviewFields,
];

const deleteReviewValidator = [
  ...validateReviewId,
];

const listReviewsValidator = [
  body("product").optional().isMongoId().withMessage("Invalid product ID"),
];

module.exports = {
  validateReviewId,
  validateProductIdParam,
  createReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
  listReviewsValidator,
};
