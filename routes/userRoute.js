
const express = require("express");
const router = express.Router();

const {
    createUser,
    deleteUser,
    getUser,
    getUsers,
    resizeImage,
    updateUser,
    uploadUserImage,
    updatePasswordUser
} = require("../services/userService.js");

const { protect, allowTo } = require("../services/authService.js");
const validate = require("../middleware/validateMiddleware.js");

const {
    createUserValidator,
    updateUserValidator,
    userIdValidator,
    updatePasswordValidator
} = require("../validators/userValidator.js");

router.get(
    "/",
    protect,
    allowTo("admin", "manager"),
    getUsers
);

router.post(
    "/",
    protect,
    allowTo("admin"),
    createUserValidator,
    validate,
    uploadUserImage,
    resizeImage,
    createUser
);

router.get(
    "/:id",
    protect,
    userIdValidator,
    validate,
    getUser
);

router.put(
    "/:id",
    protect,
    updateUserValidator,
    validate,
    updateUser
);

router.delete(
    "/:id",
    protect,
    allowTo("admin"),
    userIdValidator,
    validate,
    deleteUser
);

router.put(
    "/change-password/:id",
    protect,
    updatePasswordValidator,
    validate,
    updatePasswordUser
);

module.exports = { router };
