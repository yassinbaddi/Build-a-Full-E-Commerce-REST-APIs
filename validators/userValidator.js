
const {
    body,
    param,
} = require("express-validator");
const { userModel } = require("../models/userModel");
const ApiError = require("../utils/apiError");

const createUserValidator = [
    body("user")
        .trim()
        .notEmpty()
        .withMessage("Username is required")
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be between 3 and 30 characters"),

    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email address")
        .normalizeEmail()
        .custom(async (value) => {
            const exist = await userModel.findOne({ email: value });

            if (exist) {
                throw new ApiError("The email already exists", 409);
            }

            return true;
        }),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must contain at least 6 characters"),



    body("phone")
        .optional({ values: "falsy" })
        .isMobilePhone()
        .withMessage("Invalid phone number"),

    body("role")
        .optional()
        .isIn(["user", "admin"])
        .withMessage("Role must be user or admin")
];

const updateUserValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid user ID"),

    body("user")
        .trim()
        .notEmpty()
        .withMessage("Username is required")
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be between 3 and 30 characters")
];

const userIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid user ID")
];
const bcrypt = require('bcrypt');
const updatePasswordValidator = [
    userIdValidator,

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .bail()
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),

    body("passwordConfirm")
        .notEmpty()
        .withMessage("Password confirmation is required")
        .bail()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Password confirmation does not match");
            }

            return true;
        }),
    body("currentPassword").notEmpty().custom(async (value, { req }) => {
        const user = await userModel.findById(req.params.id)
        if (!user) {
            throw new ApiError("user not found ", 401)
        }

        const isCorrectPassword = await bcrypt.compare(
            req.body.currentPassword,
            user.password
        )
        if (!isCorrectPassword) {
            throw new ApiError("invalid password")
        }
    })
];

module.exports = {
    createUserValidator,
    updateUserValidator,
    userIdValidator,
    updatePasswordValidator
};
