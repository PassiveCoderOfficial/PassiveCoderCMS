# Payment Testing Guide

## Current State

| Gateway | Local | Production |
|---------|-------|------------|
| shurjoPay | **Sandbox** (auto, no env needed) | Live (needs env vars in Vercel) |
| Dodo Payments | **Live** (set `DODO_ENVIRONMENT=sandbox_mode` to test) | Live (needs 7 env vars in Vercel) |

---

## shurjoPay — Sandbox Testing (already active locally)

Sandbox activates automatically when `SHURJOPAY_USERNAME` is NOT set in `.env.local`.

### Test flow
1. Go to `/dashboard/subscription`
2. Choose a plan → Checkout dialog → select **shurjoPay (BD)**
3. Complete payment on sandbox checkout page (any card/mobile number works)
4. Should redirect to `/dashboard/subscription?paid=1`
5. Subscription status should flip to `active`

### Sandbox credentials (built-in, no setup needed)
- URL: `https://sandbox.shurjopayment.com`
- Username: `sp_sandbox`
- Password: `pyyk97hu&6u6`

### Go live (add to Vercel env vars)
```
SHURJOPAY_BASE_URL=https://engine.shurjopayment.com
SHURJOPAY_USERNAME=<your-merchant-username>
SHURJOPAY_PASSWORD=<your-merchant-password>
SHURJOPAY_PREFIX=<your-prefix>
```

---

## Dodo Payments — Sandbox Testing

### Setup steps
1. Go to [app.dodopayments.com](https://app.dodopayments.com) → toggle **Test Mode** (bottom-left)
2. Developer → API Keys → create a **Test** key
3. Products → create 4 test products matching live ones (Basic/Pro × Monthly/Yearly)
4. Developer → Webhooks → create webhook pointing to your ngrok/tunnel URL for local testing

### Local `.env.local` for sandbox
```
DODO_ENVIRONMENT=sandbox_mode
DODO_API_KEY=<test-api-key-from-dodo-dashboard>
DODO_WEBHOOK_SECRET=<test-webhook-secret>
DODO_PRODUCT_BASIC_YEARLY=<test-product-id>
DODO_PRODUCT_PRO_YEARLY=<test-product-id>
DODO_PRODUCT_BASIC_MONTHLY=<test-product-id>
DODO_PRODUCT_PRO_MONTHLY=<test-product-id>
NEXT_PUBLIC_WHATSAPP_NUMBER=8801678669699
```

### Test card
- Number: `4242 4242 4242 4242`
- Expiry: any future date
- CVV: any 3 digits

### Test flow
1. Set sandbox env vars above in `.env.local`
2. Go to `/dashboard/subscription` → Choose plan → **Card / PayPal**
3. Complete Dodo sandbox checkout
4. Webhook fires → subscription activates

### Webhook testing without real checkout
Dodo dashboard → Webhooks → select your webhook → **Send test event** → pick `payment.succeeded`

---

## Go-Live Checklist

### shurjoPay
- [ ] Get live credentials from shurjoPay merchant portal
- [ ] Add `SHURJOPAY_BASE_URL`, `SHURJOPAY_USERNAME`, `SHURJOPAY_PASSWORD`, `SHURJOPAY_PREFIX` to Vercel → Production
- [ ] Redeploy
- [ ] Test one real BDT payment end-to-end

### Dodo Payments
- [ ] Dodo bank verification approved (currently "Under Review")
- [ ] Add to Vercel → Production (7 vars):
  - `DODO_ENVIRONMENT=live_mode`
  - `DODO_API_KEY`
  - `DODO_WEBHOOK_SECRET`
  - `DODO_PRODUCT_BASIC_YEARLY`
  - `DODO_PRODUCT_PRO_YEARLY`
  - `DODO_PRODUCT_BASIC_MONTHLY`
  - `DODO_PRODUCT_PRO_MONTHLY`
  - `NEXT_PUBLIC_WHATSAPP_NUMBER=8801678669699`
- [ ] Redeploy
- [ ] Test one real USD card payment end-to-end

---

## WhatsApp Manual Payment Flow

No testing needed — button opens `wa.me/8801678669699` with pre-filled message.
To activate subscription after manual payment: SA Panel → Subscriptions → find tenant → set status to `active`.
