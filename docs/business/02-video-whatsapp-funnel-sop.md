# SOP — Video → WhatsApp → Close

Last updated: 2026-09-02. Owner: Wali.
Assumes [01-positioning.md](01-positioning.md).

---

## The leak this fixes

Current funnel: video runs → CTA says "WhatsApp us if you are serious about a
website" → some people message.

The video content is right. The CTA has three problems:

1. **Nothing is captured.** The ~90% who watch and do not message are gone
   forever. No email, no retargeting list, no second chance.
2. **"If you're serious" filters too early.** It sounds like a qualifier but it
   reads as a barrier. Someone genuinely interested but not yet decided does
   not message — and they were the winnable one.
3. **No next step is named.** "Message us" is vague. "Send me the word WEBSITE
   and I'll send your quote in 10 minutes" is a specific, low-effort action.

We are not short of attention. We are short of **capture**.

---

## The funnel

```
Video (YouTube / FB / TikTok)
   ↓  CTA names one specific action
Landing page  ← capture happens HERE, not in WhatsApp
   ↓  form: name, WhatsApp number, business type, country
WhatsApp conversation  (we open it, not them)
   ↓  qualify → quote → objections
Signup link with plan pre-selected
   ↓  passivecoder.com/onboarding?plan=pro&cycle=monthly
Card payment at checkout
   ↓
Onboarding call / handover
```

The key change: **the landing page sits between the video and WhatsApp.** Even
if they never reply on WhatsApp, we have their number and can follow up.

---

## Step 1 — Video CTA

Replace "WhatsApp us if you're serious" with:

> "If you want to see what this looks like for your business — go to
> passivecoder.com/start, put in your WhatsApp number, and I'll send you a
> plan for your business within one working day. It costs nothing and you're
> not committing to anything."

Why each part:
- **Named URL** — trackable, and works when the video is re-shared
- **"Plan for your business"** — a deliverable, not a chat
- **"One working day"** — a promise we can keep
- **"Costs nothing, not committing"** — removes the "serious" barrier

Say it twice: once at the moment the problem lands (mid-video), once at the end.
Put the link in the description, the pinned comment, and on-screen.

---

## Step 2 — Landing page capture

Form fields, in this order, and no more:

1. Name
2. WhatsApp number (with country picker)
3. Business type (dropdown: Trading / Construction / Services / Retail / Other)
4. Country (dropdown: UAE / Saudi / Singapore / Malaysia / Qatar / Bangladesh / Other)

Four fields. Every extra field costs conversions. Do not ask for email — the
WhatsApp number is the channel that actually works for this segment.

Confirmation message on submit:

> "Got it. We'll message you on WhatsApp within one working day with a plan
> for your business. If you'd rather talk now — [Message us on WhatsApp]."

---

## Step 3 — WhatsApp opening (we message first)

Within one working day. Never a wall of text.

> Assalamu alaikum {name}, this is {your name} from Passive Coder.
>
> You asked about a website for your {business type} business in {country}.
>
> Two quick questions so I can send you something useful and not waste your
> time:
>
> 1. Do you have a website now, or starting fresh?
> 2. Who are your customers — local, or back in Bangladesh too?

Two questions, both easy, both genuinely needed. Do not send pricing yet.

---

## Step 4 — Qualification

Work these out from the conversation. Do not interrogate.

| Signal | Good fit | Walk away |
|---|---|---|
| Business exists | Trading/operating now | "Planning to start" with no revenue |
| Customers | Has them, wants more | Expects us to generate demand from zero |
| Budget frame | Reacts normally to $40–80/mo | Wants a one-time $50 site |
| Decision | They decide | "Let me ask my partner" x3 |
| Urgency | Has a reason (new venture, lost a deal) | "Just looking" |

**Say no to bad fits, politely and early.** A $40/mo customer who churns in
month 2 costs more in support than they pay.

> "Honestly, for what you're describing right now, a full business site is more
> than you need. Come back when {X} — happy to help then."

That answer wins referrals. Chasing them wins a refund request.

---

## Step 5 — The quote message

Once qualified. One message, three parts:

> Based on what you told me, here's what I'd recommend:
>
> **Pro — $80/month.** Cancel any time, no lock-in.
>
> That gets you: full business site, your own dashboard, CRM to track leads,
> booking system, invoicing, and your ExpertNear.Me verified profile.
>
> One thing that matters for you: **we build your site first, and you see it
> before you pay anything.** Look at it, then decide.
>
> Want me to set it up so you can look?

Rules:
- Recommend **one** plan. Three options creates paralysis; they picked us to be told.
- **Lead with monthly.** "$80/month, cancel any time" is a far easier yes than
  a year upfront for a buyer who has been burned before.
- Mention yearly only *after* they are convinced, as a saving:
  *"If you'd rather pay for the year, it's $672 instead of $960 — 30% off."*
- Always mention site-before-payment. It is our strongest differentiator.
- Never open with a discount. If a discount is needed, it comes at objection time.

---

## Step 6 — Objections

**"Too expensive / I can get it for 5,000 taka"**
> You can, and it'll be a single page. The question is whether it brings you a
> customer. A page that sits there costs 5,000 taka once. A site that brings
> you two customers a month pays for itself in the first week. Which one do you
> actually want?

Then reframe per day: *"$80 a month is under $3 a day — one customer covers a year."*

**"I'll think about it"**
> Of course. Can I set up the dashboard so you're looking at your actual site
> while you think, instead of imagining it? Costs nothing and you can walk away.

This converts better than anything else we have, because it is true.

**"How do I know you won't disappear?"**
Do not get defensive — this is a fair question and our best ground:
> Fair question, you should ask it. We're a registered company with a trade
> licence, a real office, and a corporate bank account — payment doesn't go to
> anyone's personal bKash. I'm on Facebook and LinkedIn under my real name, and
> we've got 200+ videos and 12,000 subscribers on YouTube. And you get the
> dashboard before you pay. Check all of it first.

**"Can you just do a one-page site cheaper?"**
> We could, but I'd be taking your money for something I don't think will work
> for you. That's the video you watched. If a one-pager is genuinely all you
> need, there are people who do that well and I'll point you to them.

Say no. It protects the position and often reverses the objection.

**"Send me details / I'll get back to you"**
Send **one** short summary, then set a follow-up. Never send a brochure.

---

## Step 7 — Close

Send the pre-selected signup link:

```
https://passivecoder.com/onboarding?plan=pro&cycle=monthly
```

The plan and cycle carry through to signup and are shown on the account screen,
so what you quoted is what they see. (Before 2026-09-02 this silently dropped
to Basic — fixed.)

Stay in the chat while they sign up. Most drop-off happens in the first two
minutes when a question goes unanswered.

---

## Step 8 — Follow-up cadence

For anyone who filled the form and did not buy. Never more than 4 touches.

| When | Message |
|---|---|
| Day 0 | Opening (Step 3) |
| Day 2 | "Did you get a chance to look? Any questions I can answer?" |
| Day 5 | Value, not a chase — send a relevant example site we built |
| Day 12 | "Should I close this off for now, or keep it open?" |
| — | Stop. Move to the quarterly list. |

Day 12's message works because it gives permission to say no, which is exactly
why people answer it.

---

## Metrics to track weekly

| Metric | Where | Target to establish |
|---|---|---|
| Video views | YouTube/FB | baseline |
| Form submissions | Landing page | 2–5% of views |
| WhatsApp replies | Manual | 50%+ of forms |
| Qualified | Manual | 40%+ of replies |
| Signups | `tenants` table | 30%+ of qualified |
| **Paid** | `subscription_payments` | **the only one that counts** |

Until 2026-09-02 the last row was structurally zero — the card option was
hidden and disabled. Any pre-September conversion analysis is meaningless.

---

## Do not

- Do not send voice notes as a first contact
- Do not send more than 4 follow-ups
- Do not discount before an objection
- Do not promise SEO rankings or traffic numbers
- Do not quote a price you have not checked against the live pricing page
- Do not use emojis in client-facing copy
