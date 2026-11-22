
const express = require("express");
const router = express.Router();

const {
    createProduct,
    deleteProduct,
    getProduct,
    getProducts,
    updateProduct,
    uploadImages,
    resizeImages,
} = require("../services/productService.js");

const { protect, allowTo } = require("../services/authService.js");

const {
    nestedRouter: nestedReviewRouter,
} = require("./reviewRoute.js");

const validate = require("../middleware/validateMiddleware.js");

const {
    createProductValidator,
    deleteProductValidator,
    getProductValidator,
    updateProductValidator,
} = require("../validators/productValidator.js");

router.get("/", getProducts);
router.get("/:id", getProductValidator, validate, getProduct);

router.post(
    "/",
    protect,
    allowTo("admin", "manager"),
    uploadImages,
    resizeImages,
    createProductValidator,
    validate,
    createProduct
);

router.put(
    "/:id",
    protect,
    allowTo("admin", "manager"),
    updateProductValidator,
    validate,
    updateProduct
);

router.delete(
    "/:id",
    protect,
    allowTo("admin"),
    deleteProductValidator,
    validate,
    deleteProduct
);

router.use("/:productId/reviews", nestedReviewRouter);

module.exports = { router };
