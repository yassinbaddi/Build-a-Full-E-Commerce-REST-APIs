
const express = require("express");
const router = express.Router();

const {
    getCategories,
    createCategory,
    getCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
    resizeImage,
} = require("../services/categoryService.js");

const { allowTo, protect } = require("../services/authService.js");

const validate = require("../middleware/validateMiddleware.js");

const {
    nestedRouter: nestedSubCategoryRouter,
} = require("./subCategoryRoute.js");

const {
    validateCategoryId,
    validateCreateCategory,
    validateUpdateCategory,
} = require("../validators/category.validator.js");


router.get("/", getCategories);
router.get("/:id", validateCategoryId, validate, getCategory);


router.post(
    "/",
    protect,
    allowTo("admin", "manager"),
    uploadCategoryImage,
    resizeImage,
    validateCreateCategory,
    validate,
    createCategory
);

router.put(
    "/:id",
    protect,
    allowTo("admin", "manager"),
    validateUpdateCategory,
    validate,
    updateCategory
);

router.delete(
    "/:id",
    protect,
    allowTo("admin"),
    validateCategoryId,
    validate,
    deleteCategory
);

router.use("/:categoryId/subcategories", nestedSubCategoryRouter);

module.exports = { router };
