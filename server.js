import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ✅ ضع cors بعد إنشاء app
app.use(cors({
  origin: "https://www.plusconvert.sbs", // موقعك على بلوجر
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

app.post("/api/orders", async (req, res) => {
  const order = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${Buffer.from(process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_CLIENT_SECRET).toString("base64")}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: "USD", value: "10.00" } }],
    }),
  });

  const data = await order.json();
  res.json(data);
});

app.listen(10000, () => console.log("✅ Server running on port 10000"));


