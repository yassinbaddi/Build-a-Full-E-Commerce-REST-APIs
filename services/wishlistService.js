const { wishlistModel } = require("../models/wishlistModel.js");
const productModel = require("../models/productMolel.js");

const productPopulate = {
  path: "products",
  select: "title price priceAfterDiscount imageCover retingsAverage retingsQuantity",
};

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistModel
      .findOne({ user: req.user._id })
      .populate(productPopulate);

    if (!wishlist) {
      return res.status(200).json({
        message: "Wishlist is empty",
        data: { user: req.user._id, products: [] },
      });
    }

    return res.status(200).json({
      results: wishlist.products.length,
      data: wishlist,
    });
  } catch (err) {
    next(err);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: `No product found with id ${productId}`,
      });
    }

    const wishlist = await wishlistModel
      .findOneAndUpdate(
        { user: req.user._id },
        { $addToSet: { products: productId } },
        { new: true, upsert: true, runValidators: true },
      )
      .populate(productPopulate);

    return res.status(200).json({
      message: "Product added to wishlist",
      data: wishlist,
    });
  } catch (err) {
    next(err);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistModel
      .findOneAndUpdate(
        { user: req.user._id },
        { $pull: { products: req.params.productId } },
        { new: true },
      )
      .populate(productPopulate);

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist not found",
      });
    }

    return res.status(200).json({
      message: "Product removed from wishlist",
      data: wishlist,
    });
  } catch (err) {
    next(err);
  }
};

const clearWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistModel.findOneAndUpdate(
      { user: req.user._id },
      { products: [] },
      { new: true },
    );

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist not found",
      });
    }

    return res.status(200).json({
      message: "Wishlist cleared successfully",
      data: wishlist,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
};
