const express = require("express");
const router = express.Router();

const {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../services/couponService.js");

const { protect, allowTo } = require("../services/authService.js");
const validate = require("../middleware/validateMiddleware.js");

const {
  couponIdValidator,
  createCouponValidator,
  updateCouponValidator,
  deleteCouponValidator,
} = require("../validators/couponValidator.js");

router.get("/", protect, allowTo("admin"), getCoupons);

router.post(
  "/",
  protect,
  allowTo("admin"),
  createCouponValidator,
  validate,
  createCoupon,
);

router.get(
  "/:id",
  protect,
  allowTo("admin"),
  couponIdValidator,
  validate,
  getCoupon,
);

router.put(
  "/:id",
  protect,
  allowTo("admin"),
  updateCouponValidator,
  validate,
  updateCoupon,
);

router.delete(
  "/:id",
  protect,
  allowTo("admin"),
  deleteCouponValidator,
  validate,
  deleteCoupon,
);

module.exports = { router };
