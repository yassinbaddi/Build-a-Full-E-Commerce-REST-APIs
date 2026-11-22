

const express = require("express");
const router = express.Router();
const nestedRouter = express.Router({ mergeParams: true });

const {
    createSubCategory,
    deleteSubCategory,
    getSubCategories,
    getSubCategory,
    updateSubCategory,
    getSubCategoryByCategory,
    createSubCategoryByCategory,
} = require("../services/subCategoryService.js");

const { protect, allowTo } = require("../services/authService.js");
const validate = require("../middleware/validateMiddleware.js");

const {
    validateSubCategoryId,
    validateSubCategory,
    validateUpdateSubCategory,
} = require("../validators/subCategory.validator.js");

const { body, param } = require("express-validator");

const validateParentCategoryId = [
    param("categoryId")
        .isMongoId()
        .withMessage("Invalid category ID"),
];

const validateNestedSubCategory = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Subcategory name is required")
        .bail()
        .isLength({ min: 3, max: 30 })
        .withMessage("Subcategory name must be between 3 and 30 characters"),
];

router.get("/", getSubCategories);

router.post(
    "/",
    protect,
    allowTo("admin", "manager"),
    validateSubCategory,
    validate,
    createSubCategory
);

router.get("/:id", validateSubCategoryId, validate, getSubCategory);

router.put(
    "/:id",
    protect,
    allowTo("admin", "manager"),
    validateUpdateSubCategory,
    validate,
    updateSubCategory
);

router.delete(
    "/:id",
    protect,
    allowTo("admin"),
    validateSubCategoryId,
    validate,
    deleteSubCategory
);

nestedRouter.get(
    "/",
    validateParentCategoryId,
    validate,
    getSubCategoryByCategory
);

nestedRouter.post(
    "/",
    protect,
    allowTo("admin", "manager"),
    validateParentCategoryId,
    validateNestedSubCategory,
    validate,
    createSubCategoryByCategory
);

module.exports = { router, nestedRouter };
