const { cartModel } = require("../models/cartModel.js");
const { couponModel } = require("../models/couponModel.js");
const productModel = require("../models/productMolel.js");

const roundPrice = (value) => Math.round(value * 100) / 100;

const releaseCoupon = async (couponId) => {
  if (!couponId) return;

  await couponModel.updateOne(
    { _id: couponId, usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } },
  );
};

const getOrCreateCart = async (userId) => {
  let cart = await cartModel.findOne({ user: userId });

  if (!cart) {
    cart = await cartModel.create({ user: userId });
  }

  return cart;
};

const calculateCartTotals = async (cart) => {
  cart.totalPrice = roundPrice(
    cart.cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
  );

  if (!cart.coupon) {
    cart.totalPriceAfterDiscount = cart.totalPrice;
    return null;
  }

  const coupon = await couponModel.findById(cart.coupon);

  if (!coupon || !coupon.isValid()) {
    cart.coupon = undefined;
    cart.totalPriceAfterDiscount = cart.totalPrice;
    return coupon;
  }

  cart.totalPriceAfterDiscount = roundPrice(
    cart.totalPrice * (1 - coupon.discount / 100),
  );

  return null;
};

const getCart = async (req, res, next) => {
  try {
    const cart = await cartModel
      .findOne({ user: req.user._id })
      .populate({
        path: "cartItems.product",
        select: "title price priceAfterDiscount imageCover quantity",
      })
      .populate({ path: "coupon", select: "name discount expire" });

    if (!cart) {
      return res.status(200).json({
        message: "Cart is empty",
        data: { user: req.user._id, cartItems: [], totalPrice: 0 },
      });
    }

    return res.status(200).json({ data: cart });
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const quantity = req.body.quantity === undefined ? 1 : Number(req.body.quantity);

    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: `No product found with id ${productId}`,
      });
    }

    const cart = await getOrCreateCart(req.user._id);
    const existingItem = cart.cartItems.find(
      (item) => item.product.toString() === productId,
    );

    const requestedQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (requestedQuantity > product.quantity) {
      return res.status(400).json({
        message: `Only ${product.quantity} item(s) available in stock`,
      });
    }

    if (existingItem) {
      existingItem.quantity = requestedQuantity;
    } else {
      cart.cartItems.push({
        product: productId,
        quantity,
        price: product.priceAfterDiscount || product.price,
      });
    }

    await calculateCartTotals(cart);
    await cart.save();

    return res.status(200).json({
      message: "Product added to cart",
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body.quantity);

    const cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.cartItems.find(
      (cartItem) => cartItem.product.toString() === productId,
    );

    if (!item) {
      return res.status(404).json({
        message: `Product ${productId} is not in the cart`,
      });
    }

    if (quantity === 0) {
      cart.cartItems = cart.cartItems.filter(
        (cartItem) => cartItem.product.toString() !== productId,
      );
    } else {
      const product = await productModel.findById(productId);

      if (!product) {
        return res.status(404).json({
          message: `No product found with id ${productId}`,
        });
      }

      if (quantity > product.quantity) {
        return res.status(400).json({
          message: `Only ${product.quantity} item(s) available in stock`,
        });
      }

      item.quantity = quantity;
    }

    await calculateCartTotals(cart);
    await cart.save();

    return res.status(200).json({
      message: "Cart updated successfully",
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.cartItems = cart.cartItems.filter(
      (item) => item.product.toString() !== req.params.productId,
    );

    await calculateCartTotals(cart);
    await cart.save();

    return res.status(200).json({
      message: "Product removed from cart",
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const previousCoupon = cart.coupon;
    cart.cartItems = [];
    cart.coupon = undefined;
    cart.totalPrice = 0;
    cart.totalPriceAfterDiscount = 0;

    await cart.save();
    await releaseCoupon(previousCoupon);

    return res.status(200).json({
      message: "Cart cleared successfully",
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

const applyCoupon = async (req, res, next) => {
  try {
    const cart = await cartModel.findOne({ user: req.user._id });

    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    const coupon = await couponModel.findOne({
      name: String(req.body.coupon).trim().toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (!coupon.isValid()) {
      return res.status(400).json({
        message: "Coupon is expired, inactive or has reached its usage limit",
      });
    }

    if (cart.coupon && cart.coupon.toString() === coupon._id.toString()) {
      return res.status(400).json({ message: "Coupon is already applied" });
    }

    const previousCoupon = cart.coupon;

    cart.coupon = coupon._id;
    await calculateCartTotals(cart);
    await cart.save();

    await releaseCoupon(previousCoupon);
    await couponModel.updateOne(
      { _id: coupon._id },
      { $inc: { usedCount: 1 } },
    );

    return res.status(200).json({
      message: "Coupon applied successfully",
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

const removeCoupon = async (req, res, next) => {
  try {
    const cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const previousCoupon = cart.coupon;

    cart.coupon = undefined;
    await calculateCartTotals(cart);
    await cart.save();

    await releaseCoupon(previousCoupon);

    return res.status(200).json({
      message: "Coupon removed successfully",
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
};
