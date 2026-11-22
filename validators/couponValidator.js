const { body, param } = require("express-validator");

const couponIdValidator = [
  param("id").isMongoId().withMessage("Invalid coupon ID"),
];

const couponFields = [
  body("discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),

  body("expire")
    .optional()
    .isISO8601()
    .withMessage("Expiry must be a valid date")
    .bail()
    .custom((value) => {
      if (new Date(value).getTime() <= Date.now()) {
        throw new Error("Expiry date must be in the future");
      }
      return true;
    }),

  body("usageLimit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Usage limit must be at least 1"),

  body("active")
    .optional()
    .isBoolean()
    .withMessage("Active must be a boolean"),
];

const createCouponValidator = [
  body("name")
    .notEmpty()
    .withMessage("Coupon name is required")
    .bail()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Coupon name must be between 3 and 30 characters"),

  body("discount")
    .notEmpty()
    .withMessage("Discount is required")
    .bail()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),

  body("expire")
    .notEmpty()
    .withMessage("Expiry date is required")
    .bail()
    .isISO8601()
    .withMessage("Expiry must be a valid date")
    .bail()
    .custom((value) => {
      if (new Date(value).getTime() <= Date.now()) {
        throw new Error("Expiry date must be in the future");
      }
      return true;
    }),

  ...couponFields,
];

const updateCouponValidator = [
  ...couponIdValidator,
  ...couponFields,
];

const deleteCouponValidator = [
  ...couponIdValidator,
];

module.exports = {
  couponIdValidator,
  createCouponValidator,
  updateCouponValidator,
  deleteCouponValidator,
};
