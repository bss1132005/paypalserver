// server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());

// ✅ السماح فقط لموقعك بالدخول (CORS)
const allowedOrigins = [
  'https://www.plusconvert.sbs', // موقعك الرسمي
  'https://plusconvert.sbs'      // بدون www في حالة المستخدم يدخل بها
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions)); // ضع هذا قبل أي route

// ✅ إنشاء طلب PayPal
app.post('/api/orders', async (req, res) => {
  try {
    const accessToken = await generateAccessToken();

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: req.body.amount || '10.00' // المبلغ الافتراضي إذا لم يُرسل شيء
          }
        }
      ]
    };

    const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ✅ تأكيد الدفع بعد الموافقة
app.post('/api/orders/:orderID/capture', async (req, res) => {
  try {
    const { orderID } = req.params;
    const accessToken = await generateAccessToken();

    const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error capturing order:', error);
    res.status(500).json({ error: 'Capture Failed' });
  }
});

// ✅ إنشاء access token من PayPal
async function generateAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  return data.access_token;
}

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
