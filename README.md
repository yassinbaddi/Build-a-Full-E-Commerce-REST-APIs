# E-Commerce REST API

Node.js / Express / MongoDB REST API with products, categories, users, cart, wishlist, addresses, coupons, reviews, orders and payments (Cash on Delivery, Stripe, PayPal).

## Quick start

```bash
npm install
cp .env.example .env   # fill in the values
npm run dev            # http://localhost:3000
```

`server.js` starts the app and connects to MongoDB using `URI`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `development` enables morgan logging |
| `URI` | MongoDB connection string (used by `config/database.js`) |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Auth tokens |
| `CLIENT_URL` | Frontend base URL used for payment redirects |
| `CURRENCY` | ISO currency code, lowercase for Stripe (`usd`) |
| `SHIPPING_PRICE` | Flat shipping fee added to orders |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` / `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the Stripe webhook endpoint |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | PayPal REST app credentials |
| `PAYPAL_ENV` | `sandbox` or `live` |
| `RESEND_API_KEY` | Email (password reset OTP) |

## Orders and payments

All order endpoints require `Authorization: Bearer <token>`. Prices and stock are always resolved server-side from the cart — the client never sends amounts.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/orders` | Create an order from the cart. Body: `{ addressId, paymentMethod: "cash" \| "stripe" \| "paypal", notes? }` |
| `GET` | `/orders` | List my orders (`?page=&limit=&status=`) |
| `GET` | `/orders/:id` | Get one order (owner or admin) |
| `POST` | `/orders/:id/stripe/confirm` | Confirm payment after the Stripe redirect (body: `{ sessionId? }`) |
| `POST` | `/orders/:id/paypal/capture` | Capture an approved PayPal order |
| `DELETE` | `/orders/:id` | Cancel a pending order and release its stock |
| `GET` | `/orders/admin/all` | Admin: all orders with total paid revenue |
| `PATCH` | `/orders/:id/status` | Admin: `{ orderStatus }` — `processing`, `shipped`, `delivered`, `cancelled` |
| `GET` | `/api/payments/config` | Enabled payment methods and PayPal client id |

**Flow**

1. `POST /cart` items, optionally `POST /cart/apply-coupon`, then `POST /addresses` if needed.
2. `POST /orders`:
   - `cash` → order is placed immediately, `pending`; payment is collected on delivery.
   - `stripe` → returns `payment.url` (Stripe Checkout). Stock is reserved at creation.
   - `paypal` → returns `payment.approveUrl` (PayPal approval page).
3. After the redirect, call the matching confirm/capture endpoint (or let the Stripe webhook do it).

Stock is reserved when the order is created and released if the order is cancelled. An online order that never gets paid stays `pending` and can be cancelled with `DELETE /orders/:id`.

### Stripe webhook

Register the endpoint in the Stripe dashboard (Developers → Webhooks) for `checkout.session.completed` and `checkout.session.async_payment_succeeded`:

```
https://your-domain.com/api/payments/stripe/webhook
```

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`. The route is mounted with `express.raw()` **before** `express.json()`, which the signature check requires.

Local testing:

```bash
stripe listen --forward-to localhost:3000/api/payments/stripe/webhook
```

### PayPal

1. Create an app at <https://developer.paypal.com> → Apps & Credentials, copy the sandbox Client ID/Secret.
2. Set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV=sandbox`.
3. For production, create a live app and set `PAYPAL_ENV=live`.

The API uses the official `@paypal/paypal-server-sdk` (Orders v2: create → approve → capture).

## Deployment

### Docker

```bash
docker build -t ecommerce-api .
docker run --env-file .env -p 3000:3000 ecommerce-api
```

The image runs `node server.js` with `NODE_ENV=production`. Pass configuration as real environment variables — do not bake `.env` into the image.

### Render / Railway

- Build command: `npm ci --omit=dev`
- Start command: `npm run start:prod`
- Add every variable from `.env.example` in the dashboard.
- Use a managed MongoDB (Atlas) connection string for `URI`.

### VPS (Ubuntu + PM2 + Nginx)

```bash
git clone <repo> && cd <repo>
npm ci --omit=dev
pm2 start server.js --name ecommerce-api
pm2 save && pm2 startup
```

Proxy `http://127.0.0.1:3000` with Nginx and enable TLS (Certbot) so Stripe/PayPal can reach the webhook and redirect URLs over HTTPS.

### Production checklist

- [ ] `NODE_ENV=production`, real `JWT_SECRET`
- [ ] `CLIENT_URL` and `BASE_URL` point at the deployed HTTPS origin
- [ ] `CURRENCY` matches your Stripe/PayPal account
- [ ] Stripe webhook endpoint registered and `STRIPE_WEBHOOK_SECRET` set
- [ ] PayPal app switched to `live`
- [ ] MongoDB Atlas IP allow-list includes the host
- [ ] `uploads/` mounted on persistent storage if you keep local file uploads
