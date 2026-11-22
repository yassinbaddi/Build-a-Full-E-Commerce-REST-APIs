
const express = require("express");
const router = express.Router();

const {
    signup,
    login,
    forgotPassword,
    resetPassword, verifyResetCode
} = require("../services/authService.js");

const validate = require("../middleware/validateMiddleware.js");

const {
    signupValidator,
    loginValidator
} = require("../validators/authValidator.js");

router.post(
    "/signup",
    signupValidator,
    validate,
    signup
);

router.post(
    "/login",
    loginValidator,
    validate,
    login
);

router.post("/verify-reset-code", verifyResetCode);
router.post("/forgot-password", forgotPassword)
router.put("/reset-password", resetPassword);


module.exports = { router };
