const express = require("express");
const router = express.Router();
const nestedRouter = express.Router({ mergeParams: true });

const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} = require("../services/reviewService.js");

const { protect } = require("../services/authService.js");
const validate = require("../middleware/validateMiddleware.js");

const {
  validateReviewId,
  validateProductIdParam,
  createReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
} = require("../validators/reviewValidator.js");

router.get("/", getReviews);
router.get("/:id", validateReviewId, validate, getReview);

router.put(
  "/:id",
  protect,
  updateReviewValidator,
  validate,
  updateReview,
);

router.delete(
  "/:id",
  protect,
  deleteReviewValidator,
  validate,
  deleteReview,
);

nestedRouter.get(
  "/",
  validateProductIdParam,
  validate,
  getReviews,
);

nestedRouter.post(
  "/",
  protect,
  createReviewValidator,
  validate,
  createReview,
);

module.exports = { router, nestedRouter };
