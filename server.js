import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

// === CORS FIX ===
const allowedOrigins = [
  "https://www.plusconvert.sbs",
  "https://plusconvert.sbs"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

app.use(express.json());

// === PAYPAL LIVE ORDER CREATION ===
app.post("/api/orders", async (req, res) => {
  try {
    const accessToken = await generateAccessToken();
    const url = "https://api-m.paypal.com/v2/checkout/orders"; // ✅ LIVE endpoint

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "USD",
            value: "5.00"
          }
        }]
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).send({ error: "Server Error creating PayPal order" });
  }
});

app.post("/api/orders/:orderID/capture", async (req, res) => {
  try {
    const { orderID } = req.params;
    const accessToken = await generateAccessToken();
    const url = `https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Capture order error:", err);
    res.status(500).send({ error: "Server Error capturing PayPal order" });
  }
});

async function generateAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

app.listen(process.env.PORT || 10000, () => {
  console.log("✅ Server running on port 10000 (LIVE)");
});
