// server.js — Vitara Complete Stripe Backend
require("dotenv").config();
const express = require("express");
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

// Raw body for Stripe webhook
app.use("/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// ── SERVE STATIC HTML FILES ───────────────────────
app.use(express.static(__dirname));

app.get("/success.html", (req, res) => {
  res.sendFile(__dirname + "/success.html");
});

app.get("/success", (req, res) => {
  res.sendFile(__dirname + "/success.html");
});

app.get("/login.html", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});

app.get("/onboarding.html", (req, res) => {
  res.sendFile(__dirname + "/onboarding.html");
});

app.get("/dashboard.html", (req, res) => {
  res.sendFile(__dirname + "/dashboard.html");
});

app.get("/vitara-global.html", (req, res) => {
  res.sendFile(__dirname + "/vitara-global.html");
});

app.get("/onboarding.html", (req, res) => {
  res.sendFile(__dirname + "/onboarding.html");
});

// ── HEALTH CHECK ──────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
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
    return res.status(400).json({ error: "Invalid plan." });
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
      metadata: { plan, source: "vitara_web" },
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
  if (!session_id) return res.status(400).json({ error: "session_id is required" });

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
    res.status(500).json({ error: err.message });
  }
});

// ── CUSTOMER PORTAL ───────────────────────────────
app.post("/create-portal-session", async (req, res) => {
  const { customer_id } = req.body;
  if (!customer_id) return res.status(400).json({ error: "customer_id is required" });

  const domain = process.env.YOUR_DOMAIN || "http://localhost:3000";

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: `${domain}/dashboard.html`,
    });
    res.json({ url: portalSession.url });
  } catch (err) {
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
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log(`Payment completed: ${session.customer_details?.email}`);
      break;
    }
    case "customer.subscription.deleted": {
      console.log(`Subscription cancelled: ${event.data.object.id}`);
      break;
    }
    case "invoice.payment_failed": {
      console.log(`Payment failed: ${event.data.object.customer}`);
      break;
    }
    default:
      console.log(`Event: ${event.type}`);
  }

  res.json({ received: true });
});

// ── START SERVER ──────────────────────────────────
app.listen(PORT, () => {
  console.log(`✦ Vitara API running at http://localhost:${PORT}`);
});
