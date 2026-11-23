const { orderModel } = require("../models/orderModel.js");
const { cartModel } = require("../models/cartModel.js");
const { addressModel } = require("../models/addressModel.js");
const { couponModel } = require("../models/couponModel.js");
const productModel = require("../models/productMolel.js");
const ApiError = require("../utils/apiError.js");
const paymentService = require("./paymentService.js");

const roundPrice = (value) => Math.round(value * 100) / 100;

const generateOrderNumber = () => {
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${Date.now()}-${random}`;
};

const restoreStock = async (items) => {
  for (const item of items) {
    await productModel.updateOne(
      { _id: item.product },
      { $inc: { quantity: item.quantity, sold: -item.quantity } },
    );
  }
};

const deductStock = async (items) => {
  const applied = [];

  for (const item of items) {
    const result = await productModel.updateOne(
      { _id: item.product, quantity: { $gte: item.quantity } },
      { $inc: { quantity: -item.quantity, sold: item.quantity } },
    );

    if (result.matchedCount === 0) {
      await restoreStock(applied);
      throw new ApiError(
        `Only ${item.available} item(s) of "${item.title}" available in stock`,
        400,
      );
    }

    applied.push(item);
  }
};

const clearCart = async (userId) => {
  const cart = await cartModel.findOne({ user: userId });

  if (!cart) return;

  cart.cartItems = [];
  cart.coupon = undefined;
  cart.totalPrice = 0;
  cart.totalPriceAfterDiscount = 0;
  await cart.save();
};

const markOrderFailed = async (order) => {
  if (order.stockDeducted) {
    await restoreStock(order.orderItems);
    order.stockDeducted = false;
  }

  order.orderStatus = "cancelled";
  order.paymentStatus = "failed";
  await order.save();
};

const buildOrderItems = async (cartItems) => {
  const items = [];

  for (const cartItem of cartItems) {
    const product = cartItem.product;

    if (!product) {
      throw new ApiError("A product in your cart is no longer available", 400);
    }

    if (cartItem.quantity > product.quantity) {
      throw new ApiError(
        `Only ${product.quantity} item(s) of "${product.title}" available in stock`,
        400,
      );
    }

    items.push({
      product: product._id,
      title: product.title,
      imageCover: product.imageCover,
      price: cartItem.price,
      quantity: cartItem.quantity,
      available: product.quantity,
    });
  }

  return items;
};

const createOrder = async (req, res, next) => {
  try {
    const { addressId, paymentMethod, notes } = req.body;

    const cart = await cartModel
      .findOne({ user: req.user._id })
      .populate({
        path: "cartItems.product",
        select: "title imageCover price priceAfterDiscount quantity",
      });

    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    const address = await addressModel.findOne({
      _id: addressId,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        message: `No address found with id ${addressId}`,
      });
    }

    const items = await buildOrderItems(cart.cartItems);

    const itemsPrice = roundPrice(
      items.reduce((total, item) => total + item.price * item.quantity, 0),
    );

    let discount = 0;
    let couponSnapshot;

    if (cart.coupon) {
      const coupon = await couponModel.findById(cart.coupon);

      if (coupon && coupon.isValid()) {
        discount = roundPrice(itemsPrice * (coupon.discount / 100));
        couponSnapshot = { code: coupon.name, discount: coupon.discount };
      }
    }

    const shippingPrice = Number(process.env.SHIPPING_PRICE || 0);
    const totalPrice = roundPrice(itemsPrice - discount + shippingPrice);

    const orderData = {
      user: req.user._id,
      orderNumber: generateOrderNumber(),
      orderItems: items.map(({ available, ...item }) => item),
      shippingAddress: {
        alias: address.alias,
        details: address.details,
        phone: address.phone,
        city: address.city,
        postalCode: address.postalCode,
      },
      paymentMethod,
      itemsPrice,
      discount,
      shippingPrice,
      totalPrice,
      coupon: couponSnapshot,
      notes,
    };

    await deductStock(items);

    let order;

    try {
      order = await orderModel.create({ ...orderData, stockDeducted: true });
    } catch (err) {
      await restoreStock(items);
      throw err;
    }

    if (paymentMethod === "cash") {
      await clearCart(req.user._id);

      return res.status(201).json({
        message: "Order placed successfully. Payment is due on delivery",
        data: { order },
      });
    }

    try {
      if (paymentMethod === "stripe") {
        const session = await paymentService.createStripeSession(
          order,
          req.user.email,
        );

        order.stripeSessionId = session.id;
        await order.save();

        return res.status(201).json({
          message: "Order created. Complete the payment to confirm it",
          data: {
            order,
            payment: {
              method: "stripe",
              sessionId: session.id,
              url: session.url,
            },
          },
        });
      }

      const paypalOrder = await paymentService.createPaypalOrder(order);

      order.paypalOrderId = paypalOrder.id;
      await order.save();

      return res.status(201).json({
        message: "Order created. Approve the payment to confirm it",
        data: {
          order,
          payment: {
            method: "paypal",
            paypalOrderId: paypalOrder.id,
            approveUrl: paypalOrder.approveUrl,
          },
        },
      });
    } catch (err) {
      await markOrderFailed(order);
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

const markOrderPaid = async (orderId) => {
  const order = await orderModel.findById(orderId);

  if (!order) {
    throw new ApiError(`No order found with id ${orderId}`, 404);
  }

  if (order.paymentStatus === "paid") {
    return order;
  }

  if (order.orderStatus === "cancelled") {
    throw new ApiError("This order has been cancelled", 400);
  }

  order.paymentStatus = "paid";
  order.paidAt = new Date();

  if (order.orderStatus === "pending") {
    order.orderStatus = "processing";
  }

  await order.save();
  await clearCart(order.user);

  return order;
};

const confirmStripeOrder = async (req, res, next) => {
  try {
    const order = await orderModel.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: `No order found with id ${req.params.id}`,
      });
    }

    if (order.paymentMethod !== "stripe") {
      return res.status(400).json({
        message: "This order is not a Stripe order",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        message: "Order is already paid",
        data: { order },
      });
    }

    const sessionId = req.body.sessionId || order.stripeSessionId;

    if (!sessionId) {
      return res.status(400).json({
        message: "No Stripe session found for this order",
      });
    }

    const session = await paymentService.retrieveStripeSession(sessionId);

    if (
      session.metadata &&
      session.metadata.orderId &&
      session.metadata.orderId !== order._id.toString()
    ) {
      return res.status(400).json({
        message: "Payment session does not belong to this order",
      });
    }

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        message: "Payment has not been completed yet",
        paymentStatus: session.payment_status,
      });
    }

    const paidOrder = await markOrderPaid(order._id);

    return res.status(200).json({
      message: "Payment confirmed successfully",
      data: { order: paidOrder },
    });
  } catch (err) {
    next(err);
  }
};

const capturePaypalOrder = async (req, res, next) => {
  try {
    const order = await orderModel.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: `No order found with id ${req.params.id}`,
      });
    }

    if (order.paymentMethod !== "paypal") {
      return res.status(400).json({
        message: "This order is not a PayPal order",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        message: "Order is already paid",
        data: { order },
      });
    }

    if (!order.paypalOrderId) {
      return res.status(400).json({
        message: "No PayPal order found for this order",
      });
    }

    const capture = await paymentService.capturePaypalOrder(
      order.paypalOrderId,
    );

    if (!capture.completed) {
      order.paymentStatus = "failed";
      await order.save();

      return res.status(400).json({
        message: "PayPal payment was not completed",
        paypalStatus: capture.status,
      });
    }

    const paidOrder = await markOrderPaid(order._id);

    return res.status(200).json({
      message: "Payment captured successfully",
      data: { order: paidOrder, captureId: capture.captureId },
    });
  } catch (err) {
    next(err);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const filter = { user: req.user._id };

    if (req.query.status) {
      filter.orderStatus = req.query.status;
    }

    const orders = await orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalOrders = await orderModel.countDocuments(filter);

    return res.status(200).json({
      results: orders.length,
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await orderModel
      .findById(req.params.id)
      .populate({ path: "user", select: "user email phone" });

    if (!order) {
      return res.status(404).json({
        message: `No order found with id ${req.params.id}`,
      });
    }

    const isOwner = order.user._id.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You are not allowed to view this order",
      });
    }

    return res.status(200).json(order);
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderModel.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: `No order found with id ${req.params.id}`,
      });
    }

    const isOwner = order.user.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You are not allowed to cancel this order",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Paid orders cannot be cancelled. Please request a refund",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    if (order.orderStatus !== "pending") {
      return res.status(400).json({
        message: "Only pending orders can be cancelled",
      });
    }

    if (order.stockDeducted) {
      await restoreStock(order.orderItems);
      order.stockDeducted = false;
    }

    order.orderStatus = "cancelled";
    await order.save();

    return res.status(200).json({
      message: "Order cancelled successfully",
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const filter = {};

    if (req.query.status) {
      filter.orderStatus = req.query.status;
    }

    if (req.query.user) {
      filter.user = req.query.user;
    }

    const orders = await orderModel
      .find(filter)
      .populate({ path: "user", select: "user email" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalOrders = await orderModel.countDocuments(filter);
    const totalRevenue = await orderModel.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    return res.status(200).json({
      results: orders.length,
      totalOrders,
      totalRevenue: totalRevenue.length ? roundPrice(totalRevenue[0].total) : 0,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderModel.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: `No order found with id ${req.params.id}`,
      });
    }

    const { orderStatus } = req.body;

    if (order.orderStatus === "cancelled" || order.orderStatus === "delivered") {
      return res.status(400).json({
        message: `Order is already ${order.orderStatus}`,
      });
    }

    if (orderStatus === "cancelled") {
      if (order.paymentStatus === "paid") {
        return res.status(400).json({
          message: "Paid orders cannot be cancelled. Please issue a refund",
        });
      }

      if (order.stockDeducted) {
        await restoreStock(order.orderItems);
        order.stockDeducted = false;
      }
    }

    order.orderStatus = orderStatus;

    if (orderStatus === "delivered") {
      order.deliveredAt = new Date();

      if (order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.paidAt = new Date();
      }
    }

    await order.save();

    return res.status(200).json({
      message: "Order status updated successfully",
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  markOrderPaid,
  markOrderFailed,
  confirmStripeOrder,
  capturePaypalOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  clearCart,
  restoreStock,
};
