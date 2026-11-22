const { reviewModel } = require("../models/reviewModel.js");
const productModel = require("../models/productMolel.js");

const getReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const skip = (page - 1) * limit;

    const filter = {};

    if (req.params.productId) {
      filter.product = req.params.productId;
    } else if (req.query.product) {
      filter.product = req.query.product;
    }

    if (req.query.user) {
      filter.user = req.query.user;
    }

    const reviews = await reviewModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .populate({ path: "user", select: "user profileImg" })
      .populate({ path: "product", select: "title imageCover" })
      .sort({ createdAt: -1 });

    const totalReviews = await reviewModel.countDocuments(filter);

    return res.status(200).json({
      results: reviews.length,
      totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit),
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};

const getReview = async (req, res, next) => {
  try {
    const review = await reviewModel
      .findById(req.params.id)
      .populate({ path: "user", select: "user profileImg" })
      .populate({ path: "product", select: "title imageCover" });

    if (!review) {
      return res.status(404).json({
        message: `No review found with id ${req.params.id}`,
      });
    }

    return res.status(200).json(review);
  } catch (err) {
    next(err);
  }
};

const createReview = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.body.product;

    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: `No product found with id ${productId}`,
      });
    }

    const review = await reviewModel.create({
      title: req.body.title,
      comment: req.body.comment,
      rating: req.body.rating,
      product: productId,
      user: req.user._id,
    });

    return res.status(201).json({
      message: "Review created successfully",
      data: review,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "You have already reviewed this product",
      });
    }

    next(err);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const review = await reviewModel.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        message: `No review found with id ${req.params.id}`,
      });
    }

    const isOwner = review.user.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You can only update your own review",
      });
    }

    if (req.body.title !== undefined) review.title = req.body.title;
    if (req.body.comment !== undefined) review.comment = req.body.comment;
    if (req.body.rating !== undefined) review.rating = req.body.rating;

    await review.save();
    await reviewModel.calcProductRatings(review.product);

    return res.status(200).json({
      message: "Review updated successfully",
      data: review,
    });
  } catch (err) {
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const review = await reviewModel.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        message: `No review found with id ${req.params.id}`,
      });
    }

    const isOwner = review.user.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You can only delete your own review",
      });
    }

    await reviewModel.findOneAndDelete({ _id: req.params.id });

    return res.status(200).json({
      message: "Review deleted successfully",
      data: review,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
};
