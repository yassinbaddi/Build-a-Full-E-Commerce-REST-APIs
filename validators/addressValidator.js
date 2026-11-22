const { body, param } = require("express-validator");

const addressIdValidator = [
  param("id").isMongoId().withMessage("Invalid address ID"),
];

const addressFields = [
  body("alias")
    .optional()
    .isString()
    .withMessage("Alias must be a string")
    .bail()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Alias must be at most 30 characters"),

  body("details")
    .optional()
    .isString()
    .withMessage("Address details must be a string")
    .bail()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address details must be between 5 and 200 characters"),

  body("phone")
    .optional()
    .isString()
    .withMessage("Phone must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Phone is required"),

  body("city")
    .optional()
    .isString()
    .withMessage("City must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("City is required"),

  body("postalCode")
    .optional()
    .isString()
    .withMessage("Postal code must be a string")
    .bail()
    .trim(),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
];

const createAddressValidator = [
  body("details")
    .notEmpty()
    .withMessage("Address details are required")
    .bail()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address details must be between 5 and 200 characters"),

  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .bail()
    .trim(),

  body("city")
    .notEmpty()
    .withMessage("City is required")
    .bail()
    .trim(),

  ...addressFields,
];

const updateAddressValidator = [
  ...addressIdValidator,
  ...addressFields,
];

const deleteAddressValidator = [
  ...addressIdValidator,
];

module.exports = {
  addressIdValidator,
  createAddressValidator,
  updateAddressValidator,
  deleteAddressValidator,
};
