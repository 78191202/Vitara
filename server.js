// server.js — Vitara Complete Stripe Backend
// Run: node server.js

require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 4242;

// ── CORS ──────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    process.env.YOUR_DOMAIN,
  ].filter(Boolean),
  credentials: true,
}));

// Raw body for Stripe webhook signature verification
app.use("/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// ── SERVE STATIC HTML FILES ───────────────────────
app.use(express.static(path.join(__dirname)));

app.get("/success.html", (req, res) => {
  res.sendFile(path.join(__dirname, "success.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/onboarding.html", (req, res) => {
  res.sendFile(path.join(__dirname, "onboarding.html"));
});

app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// ── HEALTH CHECK ──────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Vitara API running", version: "1.0.0" });
});

// ── CREATE CHECKOUT SESSION ───────────────────────
app.post("/create-checkout-session", async (req, res) => {
  const { plan, email } = req.body;

  if (plan === "free") {
    return res.json({
      url: `${process.env.YOUR_DOMAIN || "http://localhost:3000"}/onboarding.html?plan=free`,
    });
  }

  const priceMap = {
    pro: process.env.STRIPE_PRICE_PRO,
    annual: process.env.STRIPE_PRICE_ANNUAL,
  };

  const priceId = priceMap[plan];
  if (!priceId) {
    return res.status(400).json({ error: "Invalid plan. Must be 'free', 'pro', or 'annual'." });
  }

  const domain = process.env.YOUR_DOMAIN || "http://localhost:3000";

  try {
    const sessionConfig = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `${domain}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/vitara-global.html?cancelled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      currency: undefined,
      metadata: {
        plan,
        source: "vitara_web",
      },
    };

    if (plan === "pro") {
      sessionConfig.subscription_data = {
        trial_period_days: 7,
        metadata: { plan: "pro" },
      };
    }

    if (plan === "annual") {
      sessionConfig.subscription_data = {
        metadata: { plan: "annual" },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ url: session.url });

  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET SESSION STATUS ────────────────────────────
app.get("/session-status", async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: "session_id is required" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription", "customer"],
    });

    res.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      customer_name: session.customer_details?.name,
      plan: session.metadata?.plan,
      subscription_id: session.subscription?.id,
      trial_end: session.subscription?.trial_end,
      current_period_end: session.subscription?.current_period_end,
    });

  } catch (err) {
    console.error("Session status error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── CUSTOMER PORTAL ───────────────────────────────
app.post("/create-portal-session", async (req, res) => {
  const { customer_id } = req.body;

  if (!customer_id) {
    return res.status(400).json({ error: "customer_id is required" });
  }

  const domain = process.env.YOUR_DOMAIN || "http://localhost:3000";

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: `${domain}/dashboard.html`,
    });

    res.json({ url: portalSession.url });
  } catch (err) {
    console.error("Portal session error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── STRIPE WEBHOOK ────────────────────────────────
app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Webhook received: ${event.type}`);

  switch (event.type) {

    case "checkout.session.completed": {
      const session = event.data.object;
      console.log(`Payment completed for: ${session.customer_details?.email}`);
      console.log(`Plan: ${session.metadata?.plan}`);
      console.log(`Subscription ID: ${session.subscription}`);
      break;
    }

    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object;
      console.log(`Trial ending soon for subscription: ${subscription.id}`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      console.log(`Subscription cancelled: ${subscription.id}`);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      console.log(`Payment failed for customer: ${invoice.customer}`);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      console.log(`Renewal payment succeeded: ${invoice.customer}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// ── START SERVER ──────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ✦ Vitara API Server
  ─────────────────────────────
  🌍 Running at: http://localhost:${PORT}
  💳 Stripe mode: ${process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "LIVE 🔴" : "TEST 🟡"}
  ─────────────────────────────
  Endpoints:
    GET  /                         Health check
    POST /create-checkout-session  Start Stripe checkout
    GET  /session-status           Verify payment
    POST /create-portal-session    Customer billing portal
    POST /webhook                  Stripe webhook handler
  `);
});
