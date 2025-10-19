const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🟢 إنشاء طلب جديد (Order)
app.post('/api/orders', async (req, res) => {
  try {
    const accessToken = await generateAccessToken();
    const order = await createOrder(accessToken);
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating order');
  }
});

// 🟢 تأكيد الدفع بعد نجاح العملية
app.post('/api/orders/:orderId/capture', async (req, res) => {
  const { orderId } = req.params;
  try {
    const accessToken = await generateAccessToken();
    const response = await capturePayment(orderId, accessToken);
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error capturing order');
  }
});

// 🔐 دالة لجلب التوكن من PayPal
async function generateAccessToken() {
  const response = await axios({
    url: 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_SECRET
    },
    data: 'grant_type=client_credentials'
  });
  return response.data.access_token;
}

// 🧾 إنشاء طلب جديد
async function createOrder(accessToken) {
  const response = await axios({
    url: 'https://api-m.sandbox.paypal.com/v2/checkout/orders',
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    data: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: '10.00'
          }
        }
      ]
    }
  });
  return response.data;
}

// 💰 تأكيد الدفع
async function capturePayment(orderId, accessToken) {
  const response = await axios({
    url: `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  });
  return response.data;
}

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
