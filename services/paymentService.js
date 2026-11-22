const stripe = require("../config/stripe");

const createCheckoutSession = async ({
  amount,
  currency = "usd",
  productName,
  quantity = 1,
}) => {
  if (!amount || amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  if (!productName) {
    throw new Error("Product name is required");
  }

  if (!Number.isInteger(amount)) {
    throw new Error(
      "Amount must be an integer representing the smallest currency unit"
    );
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be a positive integer");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",

    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),

          product_data: {
            name: productName,
          },

          unit_amount: amount,
        },

        quantity,
      },
    ],

    success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,

    metadata: {
      productName,
    },
  });

  return {
    id: session.id,
    url: session.url,
  };
};

module.exports = {
  createCheckoutSession,
};
