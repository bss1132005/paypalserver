// =================================================================
// THIS IS THE COMPLETE AND CORRECTED server.js CODE
// PASTE THIS ENTIRE BLOCK INTO YOUR GITHUB FILE
// =================================================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); // Loads .env file for local development

const app = express();

// --- CORS Configuration ---
// This allows your website to make requests to this server.
const allowedOrigins = [
  'https://plusconvert.sbs', // Your custom domain
  'https://www.plusconvert.sbs', // Include www just in case
  'https://plusconvert-sbs.blogspot.com'  // Replace with your actual blogspot URL if different
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like server-to-server or REST clients)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.json());

// Get PayPal credentials from Render's Environment Variables
const { PAYPAL_CLIENT_ID, PAYPAL_SECRET, NODE_ENV } = process.env;

// Automatically switch between Sandbox and Live PayPal APIs based on the NODE_ENV variable
const base = NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

/**
 * Generates an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 */
async function generateAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error("MISSING_API_CREDENTIALS");
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  
  try {
    const response = await axios.post(`${base}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error.response ? error.response.data : error.message);
    throw new Error("Cannot generate PayPal access token.");
  }
}

/**
 * Creates a new order with PayPal.
 */
async function createOrder(accessToken, plan) {
  try {
    const response = await axios.post(`${base}/v2/checkout/orders`, {
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: `PlusConvert ${plan.name} Plan`,
          amount: {
            currency_code: 'USD',
            value: plan.price
          }
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create order:", error.response ? error.response.data : error.message);
    throw new Error("Cannot create PayPal order.");
  }
}

/**
 * Captures the payment for a previously created order.
 */
async function capturePayment(orderId, accessToken) {
  try {
    const response = await axios.post(`${base}/v2/checkout/orders/${orderId}/capture`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Failed to capture payment:", error.response ? error.response.data : error.message);
    throw new Error("Cannot capture PayPal payment.");
  }
}


// --- API ROUTES ---

// Endpoint to create a new order
app.post('/api/orders', async (req, res) => {
  try {
    const { plan } = req.body; 
    if (!plan || !plan.price) {
      return res.status(400).json({ error: "Plan details with a price are required." });
    }
    
    const accessToken = await generateAccessToken();
    const order = await createOrder(accessToken, plan);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

// Endpoint to capture the payment
app.post('/api/orders/:orderId/capture', async (req, res) => {
  const { orderId } = req.params;
  try {
    const accessToken = await generateAccessToken();
    const response = await capturePayment(orderId, accessToken);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to capture order.' });
  }
});

// A simple health check route to ensure the server is running
app.get('/', (req, res) => {
  res.send('PayPal Server is alive and running.');
});


// Start the server
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
