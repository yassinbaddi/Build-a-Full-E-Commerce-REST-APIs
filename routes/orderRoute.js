const express = require("express");
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  confirmStripeOrder,
  capturePaypalOrder,
} = require("../services/orderService.js");

const { protect, allowTo } = require("../services/authService.js");
const validate = require("../middleware/validateMiddleware.js");

const {
  createOrderValidator,
  orderIdValidator,
  updateOrderStatusValidator,
} = require("../validators/orderValidator.js");

router.post("/", protect, createOrderValidator, validate, createOrder);

router.get("/", protect, getMyOrders);

router.get("/admin/all", protect, allowTo("admin"), getAllOrders);

router.get("/:id", protect, orderIdValidator, validate, getOrder);

router.post(
  "/:id/stripe/confirm",
  protect,
  orderIdValidator,
  validate,
  confirmStripeOrder,
);

router.post(
  "/:id/paypal/capture",
  protect,
  orderIdValidator,
  validate,
  capturePaypalOrder,
);

router.patch(
  "/:id/status",
  protect,
  allowTo("admin"),
  updateOrderStatusValidator,
  validate,
  updateOrderStatus,
);

router.delete("/:id", protect, orderIdValidator, validate, cancelOrder);

module.exports = { router };
