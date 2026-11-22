const { couponModel } = require("../models/couponModel.js");

const getCoupons = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const skip = (page - 1) * limit;

    const coupons = await couponModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalCoupons = await couponModel.countDocuments();

    return res.status(200).json({
      results: coupons.length,
      totalCoupons,
      currentPage: page,
      totalPages: Math.ceil(totalCoupons / limit),
      data: coupons,
    });
  } catch (err) {
    next(err);
  }
};

const getCoupon = async (req, res, next) => {
  try {
    const coupon = await couponModel.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        message: `No coupon found with id ${req.params.id}`,
      });
    }

    return res.status(200).json(coupon);
  } catch (err) {
    next(err);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const coupon = await couponModel.create(req.body);

    return res.status(201).json({
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Coupon name already exists",
      });
    }

    next(err);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await couponModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!coupon) {
      return res.status(404).json({
        message: `No coupon found with id ${req.params.id}`,
      });
    }

    return res.status(200).json({
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Coupon name already exists",
      });
    }

    next(err);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await couponModel.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        message: `No coupon found with id ${req.params.id}`,
      });
    }

    return res.status(200).json({
      message: "Coupon deleted successfully",
      data: coupon,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
