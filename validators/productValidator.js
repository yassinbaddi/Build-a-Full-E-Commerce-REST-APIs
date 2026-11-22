const { body, param } = require("express-validator");

// Reusable field validators
const productFields = [
  body("title")
    .optional()
    .isString()
    .withMessage("title must be a string")
    .bail()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("title must be between 3 and 100 characters"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),

  body("quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ min: 20, max: 200 })
    .withMessage("Description must be between 20 and 200 characters"),

  body("category").optional().isMongoId().withMessage("Invalid category ID"),

  body("colors").optional().isArray().withMessage("Colors must be an array"),

  body("colors.*")
    .optional()
    .isString()
    .withMessage("Each color must be a string"),

  body("images").optional().isArray().withMessage("Images must be an array"),

  body("images.*")
    .optional()
    .isURL()
    .withMessage("Each image must be a valid URL"),

  body("imageCover")
    .optional()
    .isURL()
    .withMessage("Cover image must be a valid URL"),
];

// CREATE
exports.createProductValidator = [
  body("title").notEmpty().withMessage("title is required"),
  body("slug").notEmpty().withMessage("Slug is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("quantity").notEmpty().withMessage("Quantity is required"),
  body("price").notEmpty().withMessage("Price is required"),
  body("imageCover").notEmpty().withMessage("Cover image is required"),
  body("category").notEmpty().withMessage("Category is required"),

  ...productFields,

  body("slug")
    .optional()
    .isString()
    .withMessage("Slug must be a string")
    .bail()
    .isLowercase()
    .withMessage("Slug must be lowercase"),
];

// GET
exports.getProductValidator = [
  param("id").isMongoId().withMessage("Invalid product ID"),
];

// UPDATE
exports.updateProductValidator = [
  param("id").isMongoId().withMessage("Invalid product ID"),

  productFields,

  body("slug")
    .optional()
    .isString()
    .withMessage("Slug must be a string")
    .bail()
    .isLowercase()
    .withMessage("Slug must be lowercase"),
];

// DELETE
exports.deleteProductValidator = [
  param("id").isMongoId().withMessage("Invalid product ID"),
];
