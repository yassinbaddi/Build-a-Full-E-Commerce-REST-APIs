const stripe = require("../config/stripe");
const {
  Client,
  Environment,
  OrdersController,
  CheckoutPaymentIntent,
  OrderApplicationContextUserAction,
} = require("@paypal/paypal-server-sdk");
const ApiError = require("../utils/apiError.js");

const stripeCurrency = () => (process.env.CURRENCY || "usd").toLowerCase();
const paypalCurrency = () => (process.env.CURRENCY || "usd").toUpperCase();

const clientUrl = () => (process.env.CLIENT_URL || process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

let paypalOrdersController = null;

const getPaypalOrdersController = () => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return null;
  }

  if (!paypalOrdersController) {
    const client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: process.env.PAYPAL_CLIENT_ID,
        oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
      },
      environment:
        process.env.PAYPAL_ENV === "live"
          ? Environment.Production
          : Environment.Sandbox,
    });

    paypalOrdersController = new OrdersController(client);
  }

  return paypalOrdersController;
};

const buildStripeLineItems = (order, currency) => {
  const lineItems = order.orderItems.map((item) => ({
    price_data: {
      currency,
      product_data: { name: item.title },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  if (order.shippingPrice > 0) {
    lineItems.push({
      price_data: {
        currency,
        product_data: { name: "Shipping" },
        unit_amount: Math.round(order.shippingPrice * 100),
      },
      quantity: 1,
    });
  }

  return lineItems;
};

const createStripeSession = async (order, email) => {
  if (!stripe) {
    throw new ApiError("Stripe is not configured", 500);
  }

  const currency = stripeCurrency();

  const params = {
    mode: "payment",
    payment_method_types: ["card"],
    line_items: buildStripeLineItems(order, currency),
    client_reference_id: order._id.toString(),
    metadata: { orderId: order._id.toString() },
    success_url: `${clientUrl()}/payment/success?order_id=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl()}/payment/cancel?order_id=${order._id}`,
  };

  if (email) {
    params.customer_email = email;
  }

  if (order.discount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(order.discount * 100),
      currency,
      duration: "once",
      name: `Order ${order.orderNumber}`,
    });

    params.discounts = [{ coupon: coupon.id }];
  }

  const session = await stripe.checkout.sessions.create(params);

  return { id: session.id, url: session.url };
};

const retrieveStripeSession = async (sessionId) => {
  if (!stripe) {
    throw new ApiError("Stripe is not configured", 500);
  }

  return stripe.checkout.sessions.retrieve(sessionId);
};

const constructStripeEvent = (req) => {
  if (!stripe) {
    throw new ApiError("Stripe is not configured", 500);
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new ApiError("Stripe webhook secret is not configured", 500);
  }

  const signature = req.headers["stripe-signature"];

  if (!signature) {
    throw new ApiError("Missing stripe-signature header", 400);
  }

  return stripe.webhooks.constructEvent(
    req.body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );
};

const createPaypalOrder = async (order) => {
  const ordersController = getPaypalOrdersController();

  if (!ordersController) {
    throw new ApiError("PayPal is not configured", 500);
  }

  const currencyCode = paypalCurrency();

  const breakdown = {
    itemTotal: {
      currencyCode,
      value: order.itemsPrice.toFixed(2),
    },
  };

  if (order.shippingPrice > 0) {
    breakdown.shipping = {
      currencyCode,
      value: order.shippingPrice.toFixed(2),
    };
  }

  if (order.discount > 0) {
    breakdown.discount = {
      currencyCode,
      value: order.discount.toFixed(2),
    };
  }

  const body = {
    intent: CheckoutPaymentIntent.Capture,
    purchaseUnits: [
      {
        referenceId: order.orderNumber,
        customId: order._id.toString(),
        invoiceId: order.orderNumber,
        description: `Order ${order.orderNumber}`,
        amount: {
          currencyCode,
          value: order.totalPrice.toFixed(2),
          breakdown,
        },
        items: order.orderItems.map((item) => ({
          name: item.title.slice(0, 127),
          quantity: String(item.quantity),
          unitAmount: {
            currencyCode,
            value: item.price.toFixed(2),
          },
        })),
      },
    ],
    applicationContext: {
      brandName: process.env.BRAND_NAME || "E-Commerce API",
      userAction: OrderApplicationContextUserAction.PayNow,
      returnUrl: `${clientUrl()}/payment/success?order_id=${order._id}`,
      cancelUrl: `${clientUrl()}/payment/cancel?order_id=${order._id}`,
    },
  };

  const response = await ordersController.createOrder({
    body,
    prefer: "return=representation",
  });

  const result = response.result || {};
  const links = result.links || [];
  const approveLink = links.find(
    (link) => link.rel === "approve" || link.rel === "payer-action",
  );

  return {
    id: result.id,
    status: result.status,
    approveUrl: approveLink ? approveLink.href : null,
  };
};

const capturePaypalOrder = async (paypalOrderId) => {
  const ordersController = getPaypalOrdersController();

  if (!ordersController) {
    throw new ApiError("PayPal is not configured", 500);
  }

  const response = await ordersController.captureOrder({
    id: paypalOrderId,
    prefer: "return=representation",
  });

  const result = response.result || {};
  const capture =
    result.purchaseUnits &&
    result.purchaseUnits[0] &&
    result.purchaseUnits[0].payments &&
    result.purchaseUnits[0].payments.captures &&
    result.purchaseUnits[0].payments.captures[0];

  return {
    completed:
      result.status === "COMPLETED" ||
      (capture && capture.status === "COMPLETED"),
    status: result.status,
    captureId: capture ? capture.id : null,
  };
};

const stripeWebhook = async (req, res) => {
  try {
    const event = constructStripeEvent(req);

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      const orderId = session.metadata && session.metadata.orderId;

      if (orderId && session.payment_status === "paid") {
        const { markOrderPaid } = require("./orderService.js");
        await markOrderPaid(orderId);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createStripeSession,
  retrieveStripeSession,
  constructStripeEvent,
  createPaypalOrder,
  capturePaypalOrder,
  stripeWebhook,
  stripeCurrency,
  paypalCurrency,
};
