# Payment Testing Guide

## Current State

| Gateway | Mode | Config location |
|---------|------|----------------|
| shurjoPay | **Sandbox** | SA Settings → Payment Gateways |
| Dodo Payments | **Live** | SA Settings → Payment Gateways |

Switch modes from SA Dashboard → Settings → Payment Gateways — no redeploy needed.

---

## Dodo Payments — Sandbox Testing

### Sandbox assets (already seeded in SA Settings)

| Item | Value |
|------|-------|
| API Key | `TWO8FmV3sVoNa_Bk.Pk3g2JjtQBObZmR65mPOs6jKpxBlbs0vU5XQGKrfcVl3MCns` |
| Webhook Secret | `whsec_m3xbS0nrdXS2SBJoDelGcGypnqfvyngY` |
| Webhook endpoint | `https://passivecoder.com/api/billing/dodo/webhook` |
| Basic Monthly | `pdt_0Ni7Da7l9rUVHt8fkjjcz` — $40/mo |
| Pro Monthly | `pdt_0Ni7DaFsIBC7EehP52Y9o` — $80/mo |
| Basic Yearly | `pdt_0Ni7DaNPwMPBuDXRwcQZS` — $240/yr |
| Pro Yearly | `pdt_0Ni7DaVw0MWBSM9KDif1H` — $480/yr |

### How to switch to sandbox
1. SA Dashboard → Settings → Payment Gateways → Dodo → **🧪 Sandbox** → Save
2. Checkout will now use sandbox API key + test products

### Test flow
1. Go to `/dashboard/subscription` → Choose plan → **Card / PayPal**
2. Use test card: `4242 4242 4242 4242`, any future expiry, any CVV
3. Complete checkout → should redirect to `/dashboard/subscription?paid=1`
4. Subscription status flips to `active` via webhook

### Webhook test (without real checkout)
Dodo dashboard (Test mode) → Webhooks → `ep_3Fp3oEQ1TKFFxrafAetRhdmEh5Z` → Send test event → `payment.succeeded`

---

## shurjoPay — Sandbox Testing (already active)

shurjoPay is set to **Sandbox** by default. Uses public shurjoPay test credentials.

### Test flow
1. Go to `/dashboard/subscription` → Choose plan → **shurjoPay (BD)**
2. Complete payment on shurjoPay sandbox page (any input works)
3. Redirect to `/dashboard/subscription?paid=1`
4. Subscription activates

### Sandbox credentials (built into SA Settings, public defaults)
- URL: `https://sandbox.shurjopayment.com`
- Username: `sp_sandbox`
- Password: `pyyk97hu&6u6`

---

## Go-Live Checklist

### Dodo Payments (already live — bank Under Review)
- [x] Live API key seeded in SA Settings
- [x] Live webhook secret seeded in SA Settings
- [x] Live product IDs seeded in SA Settings
- [x] Mode = **Live** in SA Settings
- [ ] Bank verification approved by Dodo
- [ ] Test one real USD card payment end-to-end

### shurjoPay
- [ ] Get live merchant credentials from shurjoPay
- [ ] SA Settings → Payment Gateways → shurjoPay → **🟢 Live** → fill credentials → Save
- [ ] Test one real BDT payment end-to-end

---

## WhatsApp Manual Payment Flow

Number `8801678669699` seeded in SA Settings.
Button opens `wa.me/8801678669699` with pre-filled plan/amount message.
To activate subscription after manual payment: SA Panel → Subscriptions → set status to `active`.
