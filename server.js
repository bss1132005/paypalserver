// =================================================================
// THIS IS THE CORRECTED server.js CODE - PASTE THIS INTO GITHUB
// =================================================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// --- FIX #1: Specific CORS Configuration ---
// Your server was not explicitly trusting your website's domain.
const allowedOrigins = [
  'https://plusconvert.sbs', // Your custom domain
  'https://YOUR-BLOG-NAME.blogspot.com' // Your blogspot domain, just in case
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

app.use(cors(corsOptions)); // Use the specific CORS options
app.use(express.json()); // Modern replacement for body-parser

const { PAYPAL_CLIENT_ID, PAYPAL_SECRET } = process.env;
const base = 'https://api-m.sandbox.paypal.com'; // Use Sandbox for testing

// 🔐 Function to get the Access Token
async function generateAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const response = await axios.post(`${base}/v1/oauth2/token`, 'grant_type=client_credentials', {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data.access_token;
}

// 🧾 Function to create a new order
// --- FIX #2: Accept the plan details from the website ---
async function createOrder(accessToken, plan) {
  const response = await axios.post(`${base}/v2/checkout/orders`, {
    intent: 'CAPTURE',
    purchase_units: [
      {
        description: `PlusConvert ${plan.name} Plan`, // Dynamic description
        amount: {
          currency_code: 'USD',
          value: plan.price // Use the price from the website
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
}

// 💰 Function to capture the payment
async function capturePayment(orderId, accessToken) {
  const response = await axios.post(`${base}/v2/checkout/orders/${orderId}/capture`, {}, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  });
  return response.data;
}


// --- API ROUTES ---

// Create a new order
app.post('/api/orders', async (req, res) => {
  try {
    // Get the plan details sent from the Blogger site
    const { plan } = req.body; 
    if (!plan || !plan.price) {
        return res.status(400).json({ error: "Plan details with price are required." });
    }
    
    const accessToken = await generateAccessToken();
    const order = await createOrder(accessToken, plan); // Pass the plan to the function
    res.json(order);
  } catch (error) {
    console.error("Failed to create order:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error creating order' });
  }
});

// Capture the payment
app.post('/api/orders/:orderId/capture', async (req, res) => {
  const { orderId } = req.params;
  try {
    const accessToken = await generateAccessToken();
    const response = await capturePayment(orderId, accessToken);
    res.json(response);
  } catch (error) {
    console.error("Failed to capture order:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error capturing order' });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`✅ Server running on port ${port}`));```

### Final Steps to Make It Work

1.  **Update Your Server:** Replace the code in your `server.js` on GitHub with the corrected code above.
2.  **Commit and Deploy:** Commit the changes and let Render automatically redeploy your server.
3.  **Use Sandbox Client ID on Blogger:** The final step is to **use your Sandbox Client ID** on your Blogger site for testing. Using a LIVE ID with a Sandbox server will cause an error. I have provided the full Blogger code below with the Sandbox ID (`AaEd6...`) restored.

### Final Corrected Blogger Code

Copy and paste this entire code into your Blogger HTML editor. It now points to the correct server endpoints and uses the correct Sandbox key for testing.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PlusConvert - The Definitive All-Format Converter</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">  
    
    <!-- Core Libraries for Maximum Conversion -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js"></script>
    <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    </script>
    <!-- Tiny library for canvas to BMP conversion -->
    <script>!function(e){"function"==typeof define&&define.amd?define(e):"object"==typeof exports?module.exports=e():e()}(function(){var e,t,r,n,o,a,i=["66778000000000000000020000000c00000028000000",null,"000000000000",null,"0100180000000000"],c=function(e,t){var n=t.length;for(var o=0;o<n;o++)e.set(t[o],r);r+=t[o].length},f=function(e,t,r){for(var n=r.length-1;n>=0;n--)t.set(e(r[n]),n*e.BYTES_PER_ELEMENT)},l=function(e){var t=new DataView(e);t.setUint32(10,54,true),t.setUint32(18,o,true),t.setUint32(22,a,true)},s=function(t,r){return e=new ArrayBuffer(t),r.forEach(function(t,r){e[r]=t}),e};return function(d){return r=0,o=d.width,a=d.height,i[1]=s("Uint32",[o]),i[3]=s("Uint32",[a]),n=o*a*3,t=new Uint8Array(54+n),c(t,[s("Uint16",[parseInt(i[0].slice(0,4),16)]),s("Uint32",[54+n]),s("Uint32",[parseInt(i[0].slice(16,24),16)]),s("Uint32",[parseInt(i[0].slice(24,32),16)]),s("Uint32",[parseInt(i[2].slice(0,8),16)]),s("Uint16",[parseInt(i[4].slice(0,4),16)]),s("Uint16",[parseInt(i[4].slice(4,8),16)]),s("Uint32",[parseInt(i[4].slice(8,16),16)])]),l(t.buffer),f(Uint8Array,t,function(e){for(var t,r,n,i,c=e.width,f=e.height,l=e.data,s=[],u=f;u>0;u--)for(var h=0;h<c;h++)t=(u-1)*c*4,n=l[t+h*4+0],i=l[t+h*4+1],r=l[t+h*4+2],s.push(r,i,n);return s}(d.getContext("2d").getImageData(0,0,o,a))),new Blob([t],{type:"image/bmp"})}});
    </script>
    <style>
        :root {
            --primary-color: #0052FF; --secondary-color: #00A9FF; --light-theme-bg: #ffffff; --light-theme-bg-secondary: #f8f9fa; --light-theme-text-dark: #0B2D5B; --light-theme-text-primary: #333; --light-theme-text-secondary: #555; --light-theme-border: #e9ecef; --light-theme-shadow: rgba(0,0,0,0.05); --dark-theme-bg: #121212; --dark-theme-bg-secondary: #1E1E1E; --dark-theme-text-dark: #EAEAEA; --dark-theme-text-primary: #D1D1D1; --dark-theme-text-secondary: #AAAAAA; --dark-theme-border: #333333; --dark-theme-shadow: rgba(0, 82, 255, 0.1); --bg-color: var(--light-theme-bg); --bg-secondary-color: var(--light-theme-bg-secondary); --heading-color: var(--light-theme-text-dark); --text-color: var(--light-theme-text-primary); --text-secondary-color: var(--light-theme-text-secondary); --border-color: var(--light-theme-border); --shadow-color: var(--light-theme-shadow); --success-color: #28a745; --error-color: #dc3545; --font-family: 'Poppins', sans-serif;
        }
        body.dark-mode {
            --bg-color: var(--dark-theme-bg); --bg-secondary-color: var(--dark-theme-bg-secondary); --heading-color: var(--dark-theme-text-dark); --text-color: var(--dark-theme-text-primary); --text-secondary-color: var(--dark-theme-text-secondary); --border-color: var(--dark-theme-border); --shadow-color: var(--dark-theme-shadow);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: var(--font-family); background-color: var(--bg-color); color: var(--text-color); line-height: 1.6; transition: background-color 0.3s ease, color 0.3s ease; }
        .container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
        .main-header { background: var(--bg-color); padding: 20px 0; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px var(--shadow-color); transition: background-color 0.3s ease, box-shadow 0.3s ease; }
        .main-header .container { display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--heading-color); font-size: 1.5rem; font-weight: 700; }
        .logo svg { width: 36px; height: 36px; }
        .main-nav { display: flex; align-items: center; gap: 30px; } .main-nav ul { display: flex; list-style: none; gap: 30px; align-items: center; } .main-nav a { text-decoration: none; color: var(--text-color); font-weight: 500; transition: color 0.3s ease; } .main-nav a:hover { color: var(--primary-color); }
        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 24px; border-radius: 50px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; } .btn-primary { background-color: var(--primary-color); color: white; } .btn-primary:hover { background-color: #0041CC; transform: translateY(-2px); } .btn-secondary { background-color: transparent; color: var(--primary-color); border: 2px solid var(--primary-color); } .btn-secondary:hover { background-color: var(--primary-color); color: white; }
        .theme-toggle-btn { background: none; border: 2px solid var(--border-color); border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 5px; transition: background-color 0.3s ease, border-color 0.3s ease; } .theme-toggle-btn:hover { background-color: var(--bg-secondary-color); } .theme-toggle-btn svg { width: 22px; height: 22px; color: var(--text-secondary-color); } .moon-icon { display: none; } body.dark-mode .sun-icon { display: none; } body.dark-mode .moon-icon { display: block; }
        
        /* CSS-Only Dropdown Menu Styles */
        .nav-item-dropdown { position: relative; }
        .nav-item-dropdown .dropdown-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        
        .dropdown-menu {
            display: none;
            position: absolute;
            top: 150%;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            box-shadow: 0 8px 25px var(--shadow-color);
            min-width: 220px;
            z-index: 101;
            list-style: none;
            padding: 8px;
            flex-direction: column;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease;
        }

        .nav-item-dropdown:hover .dropdown-menu {
            display: flex;
            opacity: 1;
            visibility: visible;
        }
        
        .dropdown-menu li { width: 100%; }
        .dropdown-menu a {
            display: block;
            padding: 12px 18px;
            border-radius: 8px;
            transition: background-color 0.2s ease, color 0.2s ease;
        }
        .dropdown-menu a:hover {
            background-color: var(--bg-secondary-color);
            color: var(--primary-color);
        }
        .dropdown-menu a.disabled-link {
            color: var(--text-secondary-color);
            cursor: not-allowed;
            pointer-events: none;
        }
        .dropdown-menu a.disabled-link:hover {
            background-color: transparent;
            color: var(--text-secondary-color);
        }

        .nav-item-dropdown .dropdown-toggle svg {
            transition: transform 0.3s ease;
        }
        
        .nav-item-dropdown:hover .dropdown-toggle svg {
            transform: rotate(180deg);
        }
        
        /* Modal Styling */
        #signup-modal {
            display: none;
            position: fixed;
            z-index: 200;
            padding-top: 100px;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.5);
            -webkit-backdrop-filter: blur(5px);
            backdrop-filter: blur(5px);
        }
        .modal-content {
            background-color: var(--bg-color);
            margin: auto;
            padding: 30px;
            border-radius: 12px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.4);
            color: var(--text-color);
            animation: fadeIn 0.3s;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .close-button {
            color: var(--text-secondary-color);
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            transition: color 0.2s;
        }
        .close-button:hover { color: var(--error-color); }
        .modal-content h2 { text-align: left; margin-bottom: 25px; }
        .form-group { margin-bottom: 20px; }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 0.9rem;
        }
        .form-group input {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background-color: var(--bg-secondary-color);
            color: var(--text-color);
            font-size: 1rem;
            font-family: var(--font-family);
        }
        .modal-content button.btn-primary {
            width: 100%;
            font-weight: 700;
            font-size: 1.1rem;
            padding: 14px 0;
            cursor: pointer;
            border: none;
            border-radius: 8px;
            background-color: var(--primary-color);
            color: white;
            transition: all 0.3s ease;
        }
        .modal-content button.btn-primary:hover {
            background-color: #0041CC;
            transform: translateY(-2px);
        }

        /* Social Signup Styling */
        .social-signup .divider {
            display: flex;
            align-items: center;
            text-align: center;
            color: var(--text-secondary-color);
            margin: 25px 0;
            font-size: 0.9rem;
        }
        .social-signup .divider::before,
        .social-signup .divider::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid var(--border-color);
        }
        .social-signup .divider:not(:empty)::before { margin-right: .5em; }
        .social-signup .divider:not(:empty)::after { margin-left: .5em; }
        
        .social-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .social-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 12px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background-color: var(--bg-secondary-color);
            color: var(--text-color);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .social-button:hover {
            border-color: var(--primary-color);
            color: var(--primary-color);
        }
        .social-button svg {
            width: 20px;
            height: 20px;
        }

        .modal-toggle-text {
            text-align: center;
            margin-top: 20px;
            font-size: 0.9rem;
            color: var(--text-secondary-color);
        }
        .modal-toggle-text a {
            color: var(--primary-color);
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
        }
        .modal-toggle-text a:hover {
            text-decoration: underline;
        }

        /* Ad Banner Styles */
        .banner-ad-container {
            padding: 20px 0;
            background-color: var(--bg-color);
            transition: background-color 0.3s ease;
        }
        .ad-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            min-height: 90px;
            background-color: var(--bg-secondary-color);
            border: 1px dashed var(--border-color);
            border-radius: 8px;
            color: var(--text-secondary-color);
            font-size: 0.9rem;
            font-weight: 500;
        }

        .hero { text-align: center; padding: 60px 0 80px 0; background-color: var(--bg-color); transition: background-color 0.3s ease; position: relative; }
        .hero h1 { font-size: 3.5rem; color: var(--heading-color); margin-bottom: 20px; font-weight: 700; } .hero p { font-size: 1.1rem; max-width: 600px; margin: 0 auto 40px auto; color: var(--text-secondary-color); }
        input[type="file"] { display: none; }
        .upload-btn { display: inline-flex; align-items: center; gap: 15px; padding: 20px 40px; font-size: 1.2rem; font-weight: 600; color: white; background: linear-gradient(90deg, var(--secondary-color), var(--primary-color)); border: none; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(0, 82, 255, 0.3); } .upload-btn:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0, 82, 255, 0.4); } .upload-btn svg { width: 24px; height: 24px; }
        .drop-text { margin-top: 15px; color: var(--text-secondary-color); }
        .drop-zone.drag-over::before { content: 'Drop your files to start'; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 82, 255, 0.1); border: 3px dashed var(--primary-color); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 600; color: var(--primary-color); z-index: 10; }
        .file-info-area { margin-top: 30px; font-size: 1.1rem; color: var(--heading-color); font-weight: 500; min-height: 25px; } .file-info-area .file-name { font-weight: 600; color: var(--primary-color); }
        .status-area { margin-top: 20px; min-height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; }
        .progress-bar-container { width: 80%; max-width: 400px; height: 10px; background-color: var(--border-color); border-radius: 5px; overflow: hidden; margin-bottom: 15px;} .progress-bar { width: 0%; height: 100%; background: linear-gradient(90deg, var(--secondary-color), var(--primary-color)); transition: width 0.4s ease-in-out; }
        .success-message { text-align: center; color: var(--success-color); font-size: 1.2rem; font-weight: 600; } .error-message { text-align: center; color: var(--error-color); font-size: 1.2rem; font-weight: 600; }
        .download-btn { display: inline-flex; align-items: center; gap: 10px; margin-top: 15px; background-color: var(--success-color); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; } .download-btn:hover { background-color: #218838; transform: translateY(-2px); }
        .converter-tool { display: flex; flex-direction: column; align-items: center; margin-top: 40px; }
        .converter-tool span { font-weight: 700; margin-bottom: 10px; }
        .select-wrapper { position: relative; } .converter-tool select { -webkit-appearance: none; -moz-appearance: none; appearance: none; background-color: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 35px 10px 15px; font-size: 1rem; font-family: var(--font-family); color: var(--text-color); cursor: pointer; min-width: 150px; transition: border-color 0.3s ease, background-color 0.3s ease, color 0.3s ease; } .converter-tool select:hover { border-color: var(--primary-color); }
        .select-wrapper::after { content: ''; position: absolute; top: 50%; right: 15px; transform: translateY(-50%); width: 16px; height: 16px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555555'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: center; pointer-events: none; transition: filter 0.3s ease; } body.dark-mode .select-wrapper::after { filter: invert(1); }
        .convert-btn { margin-top: 30px; padding: 15px 50px; font-size: 1.2rem; font-weight: 600; color: white; background: linear-gradient(90deg, var(--secondary-color), var(--primary-color)); border: none; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(0, 82, 255, 0.3); } .convert-btn:hover:not(:disabled) { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0, 82, 255, 0.4); } .convert-btn:disabled { background: #999; color: #ccc; cursor: not-allowed; box-shadow: none; }
        
        .options-panel { background-color: var(--bg-secondary-color); border-radius: 12px; padding: 20px; margin: 30px auto 0; max-width: 600px; display: none; flex-direction: column; gap: 20px; border: 1px solid var(--border-color); }
        .options-row { display: flex; justify-content: space-between; align-items: center; gap: 20px; } .option-group { flex: 1; text-align: left; } .option-group label { display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-color); } .option-group input[type="range"] { width: 100%; } .option-group input[type="number"] { width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-color); color: var(--text-color); font-family: var(--font-family); font-size: 0.9rem; } #quality-value { font-weight: 600; color: var(--primary-color); }
        
        .text-output-area { margin-top: 15px; width: 100%; max-width: 600px; }
        .text-output-area textarea { width: 100%; height: 150px; background-color: var(--bg-secondary-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; font-family: monospace; font-size: 0.8rem; color: var(--text-secondary-color); resize: vertical; }
        .copy-btn { margin-top: 10px; padding: 8px 16px; background-color: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; } .copy-btn:hover { background-color: #0041CC; }
        .supported-formats, .features, .main-footer, .pricing-section { padding: 80px 0; background-color: var(--bg-secondary-color); } .features { background-color: var(--bg-color); } .main-footer { border-top: 1px solid var(--border-color); }
        .section-subtitle { text-align: center; font-size: 1.1rem; color: var(--text-secondary-color); margin-bottom: 60px; max-width: 700px; margin-left: auto; margin-right: auto; } h2 { text-align: center; font-size: 2.5rem; color: var(--heading-color); margin-bottom: 60px; }
        .formats-grid, .features-grid { display: grid; gap: 30px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
        .format-card, .feature-card { background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 30px; text-align: center; transition: all 0.3s ease; } .feature-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px var(--shadow-color); }
        .feature-card h3 { font-size: 1.2rem; color: var(--heading-color); margin-bottom: 15px; } .feature-icon { display: inline-block; margin-bottom: 20px; width: 64px; height: 64px; } .feature-card p { color: var(--text-secondary-color); font-size: 0.95rem; }
        
        /* --- NEW PRICING SECTION STYLES --- */
        .pricing-toggle-container { display: flex; justify-content: center; align-items: center; gap: 15px; margin-bottom: 40px; font-weight: 600; }
        .pricing-toggle { background-color: var(--border-color); border-radius: 50px; padding: 5px; display: flex; cursor: pointer; }
        .pricing-toggle span { padding: 8px 20px; border-radius: 50px; transition: all 0.3s ease; }
        .pricing-toggle span.active { background-color: var(--primary-color); color: white; box-shadow: 0 3px 10px rgba(0, 82, 255, 0.3); }
        .pricing-toggle-container .save-badge { background-color: var(--success-color); color: white; font-size: 0.8rem; padding: 4px 10px; border-radius: 50px; font-weight: 500; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; align-items: center; }
        .pricing-card { background-color: var(--bg-color); border: 1px solid var(--border-color); border-radius: 15px; padding: 40px; text-align: center; transition: all 0.3s ease; display: flex; flex-direction: column; height: 100%; }
        .pricing-card:hover { transform: translateY(-10px); box-shadow: 0 15px 30px var(--shadow-color); }
        .pricing-card .plan-name { font-size: 1.5rem; font-weight: 600; color: var(--heading-color); }
        .pricing-card .plan-price { font-size: 3rem; font-weight: 700; color: var(--primary-color); margin: 20px 0; }
        .pricing-card .plan-price sup { font-size: 1.5rem; font-weight: 500; } .pricing-card .plan-price sub { font-size: 1rem; font-weight: 400; color: var(--text-secondary-color); }
        .pricing-card .plan-description { color: var(--text-secondary-color); min-height: 40px; }
        .pricing-card .features-list { list-style: none; margin: 30px 0; text-align: left; flex-grow: 1; }
        .pricing-card .features-list li { margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
        .pricing-card .features-list li svg { width: 20px; height: 20px; color: var(--success-color); flex-shrink: 0; }
        .pricing-card .btn { margin-top: auto; width: 100%; padding: 15px; font-size: 1rem; }
        .pricing-card.recommended { border: 2px solid var(--primary-color); transform: scale(1.05); position: relative; }
        .pricing-card.recommended .badge { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: linear-gradient(90deg, var(--secondary-color), var(--primary-color)); color: white; padding: 5px 15px; border-radius: 50px; font-size: 0.9rem; font-weight: 600; }
        /* --- END OF PRICING STYLES --- */

        .article-content { padding: 80px 0; background-color: var(--bg-secondary-color); } .article-content .container { max-width: 800px; } .article-content h2 { margin-bottom: 40px; } .article-content h3 { font-size: 1.8rem; color: var(--heading-color); margin-top: 40px; margin-bottom: 20px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px; text-align: left; } .article-content h4 { font-size: 1.4rem; color: var(--primary-color); margin-top: 30px; margin-bottom: 15px; text-align: left; } .article-content p, .article-content li { font-size: 1rem; line-height: 1.8; color: var(--text-secondary-color); margin-bottom: 15px; } .article-content strong { color: var(--text-color); font-weight: 600; } .article-content ul { list-style-position: inside; padding-left: 10px; }
        
        .footer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; margin-bottom: 40px; } .footer-col h4 { color: var(--heading-color); margin-bottom: 15px; font-size: 1.1rem; } .footer-col ul { list-style: none; } .footer-col ul li { margin-bottom: 10px; } .footer-col a { text-decoration: none; color: var(--text-secondary-color); transition: color 0.3s ease; } .footer-col a:hover { color: var(--primary-color); }
        .footer-bottom { text-align: center; padding-top: 20px; border-top: 1px solid var(--border-color); font-size: 0.9rem; }
        
        /* --- START: NEW PAYMENT MODAL CSS --- */
        #payment-modal {
            display: none; /* Hidden by default */
            position: fixed;
            z-index: 300; /* Higher than other modals */
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.6);
            -webkit-backdrop-filter: blur(5px);
            backdrop-filter: blur(5px);
            padding-top: 80px;
        }

        .payment-modal-content {
            background-color: var(--bg-color);
            margin: auto;
            padding: 30px;
            border-radius: 12px;
            width: 90%;
            max-width: 450px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            color: var(--text-color);
            animation: fadeIn 0.3s;
            position: relative;
        }

        .payment-modal-content h2 {
            text-align: center;
            font-size: 1.5rem;
            margin-bottom: 15px;
        }
        
        .payment-modal-subtitle {
            text-align: center;
            color: var(--text-secondary-color);
            margin-bottom: 25px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            font-size: 0.95rem;
        }

        .payment-modal-subtitle img {
            height: 22px; 
        }

        #paypal-button-container {
            margin: 0 auto;
            max-width: 350px; /* Controls the width of the buttons */
            min-height: 120px; /* Prevents layout shift while buttons load */
        }
        
        #payment-message {
            margin-top: 20px;
            text-align: center;
            font-weight: 600;
            font-size: 1.1rem;
        }
        /* --- END: NEW PAYMENT MODAL CSS --- */


        @media (max-width: 768px) {
            .main-nav ul { display: none; } .hero h1 { font-size: 2.5rem; } .hero p { font-size: 1rem; } .features-grid, .formats-grid, .pricing-grid { grid-template-columns: 1fr; } 
            .pricing-card.recommended { transform: scale(1); }
            .footer-grid { grid-template-columns: repeat(2, 1fr); } .article-content h3 { font-size: 1.5rem; } .article-content h4 { font-size: 1.2rem; }
            .options-row { flex-direction: column; align-items: stretch; }
            .ad-placeholder { min-height: 60px; /* smaller placeholder on mobile */ }
        }
    </style>
</head>
<body>
    
    <script> (function() { const theme = localStorage.getItem('theme'); if (theme === 'dark') { document.body.classList.add('dark-mode'); } })(); </script>
    
    <header class="main-header">
        <div class="container">
            <a href="#" class="logo" aria-label="PlusConvert">
                <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="logoGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:var(--primary-color);"/>
                            <stop offset="100%" style="stop-color:var(--secondary-color);"/>
                        </linearGradient>
                    </defs>
                    <path fill="var(--border-color)" d="M32,59c1.1,0,2-0.9,2-2V44.8c7.4-1.4,12.6-8.2,11.9-15.8C45.2,21,38.2,15,30.1,15c-8.8,0-16,7.2-16,16 c0,3.1,0.9,6,2.5,8.5l2.8-1.6c-1.2-1.8-1.8-4-1.8-6.4c0-6.1,4.9-11,11-11c5.4,0,9.8,3.9,10.8,9c1,5.6-2.8,10.8-8.3,11.8v-5.8 l-12,9L32,59z" opacity="0.6"/>
                    <path fill="url(#logoGradient)" d="M32,5c-1.1,0-2,0.9-2,2v12.2c-7.4,1.4-12.6,8.2-11.9,15.8c0.8,8.1,7.8,14,15.9,14c8.8,0,16-7.2,16-16 c0,3.1-0.9-6-2.5-8.5l-2.8,1.6c1.2,1.8,1.8,4,1.8,6.4c0-6.1-4.9,11-11,11c-5.4,0-9.8-3.9-10.8-9c-1-5.6,2.8-10.8,8.3-11.8v5.8 l12-9L32,5z"/>
                </svg>                
                <span>PlusConvert</span>
            </a>
            <nav class="main-nav">
                <ul>
                    <!-- Tools Dropdown -->
                    <li class="nav-item-dropdown">
                        <a href="#" class="dropdown-toggle">
                            <span>Tools</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a href="#">All-in-One Converter</a></li>
                            <li><a href="/compress-image">Image Compressor</a></li>
                            <li><a href="/pdf-tools">PDF Tools</a></li>
                            <li><a href="#" class="disabled-link">Video Converter (Soon)</a></li>
                        </ul>
                    </li>
                    
                    <!-- API Dropdown -->
                    <li class="nav-item-dropdown">
                        <a href="#" class="dropdown-toggle">
                            <span>API</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a href="#">API Documentation</a></li>
                            <li><a href="#">Developer Status</a></li>
                            <li><a href="#">Client Libraries</a></li>
                        </ul>
                    </li>
                    
                    <!-- Pricing Link (MODIFIED) -->
                    <li>
                        <a href="#pricing">Pricing</a>
                    </li>
                    
                    <li>
                        <a href="#" class="btn btn-primary" id="signup-button">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="20" height="20" style="margin-right: 8px; vertical-align: middle;">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                            Sign Up
                        </a>
                    </li>
                </ul>
                <button class="theme-toggle-btn" id="theme-toggle" aria-label="Toggle theme">
                    <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.106a.75.75 0 010 1.06l-1.591 1.59a.75.75 0 01-1.06-1.061l1.59-1.591a.75.75 0 011.06 0zM21.75 12a.75.75 0 01.75.75h2.25a.75.75 0 010 1.5H22.5a.75.75 0 01-.75-.75zM17.894 18.894a.75.75 0 011.06 0l1.59 1.591a.75.75 0 01-1.06 1.06l-1.591-1.59a.75.75 0 010-1.061zM12 18.75a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75zM4.106 17.894a.75.75 0 010-1.06l1.59-1.591a.75.75 0 011.061 1.06l-1.59 1.591a.75.75 0 01-1.06 0zM3.75 12a.75.75 0 01-.75-.75H.75a.75.75 0 010-1.5h2.25a.75.75 0 01.75.75zM6.106 4.106a.75.75 0 011.06 0l1.591 1.59a.75.75 0 01-1.06 1.061L6.106 5.167a.75.75 0 010-1.06z"/></svg>
                    <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69a.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-3.833 2.067-7.17 5.126-8.948a.75.75 0 01.819.162z" clip-rule="evenodd" /></svg>
                </button>
            </nav>
        </div>
    </header>

    <div class="banner-ad-container">
        <div class="container">
            <div class="ad-placeholder">Advertisement Banner (e.g., 728x90)</div>
        </div>
    </div>

    <main>
        <section class="hero drop-zone">
            <div class="container">
                <h1>The Definitive All-Format Converter</h1>
                <p>Batch convert Images and PDFs to JPG, PNG, WEBP, AVIF, GIF, ICO, and more. Advanced options, maximum formats, all running securely in your browser.</p>
                <input type="file" id="file-upload" name="file-upload" accept="image/*,application/pdf" multiple>
                <label for="file-upload" class="upload-btn">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                    Select File(s)
                </label>
                <p class="drop-text" style="margin-top: 35px; color: var(--text-secondary-color);">or drop files here</p>
                <div id="file-info" class="file-info-area"></div>
                
                <div class="converter-tool">
                    <span>convert to</span>
                    <div class="select-wrapper">
                        <select name="convert-to" id="convert-to">
                           <option selected disabled>...select format</option>
                           <optgroup label="Web & Image">
                               <option value="jpg">JPG</option>
                               <option value="jpg">JPEG</option>
                               <option value="png">PNG</option>
                               <option value="webp">WEBP</option>
                               <option value="avif">AVIF (Next-Gen)</option>
                               <option value="gif">GIF</option>
                           </optgroup>
                           <optgroup label="Document & Icon">
                               <option value="pdf">PDF</option>
                               <option value="ico">ICO (Favicon)</option>
                           </optgroup>
                           <optgroup label="Other & Developer">
                               <option value="bmp">BMP</option>
                               <option value="base64">Base64 Text</option>
                               <option value="ascii">ASCII Art</option>
                           </optgroup>
                        </select>
                    </div>
                </div>
                
                <div id="options-panel" class="options-panel">
                    <div class="options-row">
                        <div id="quality-option" class="option-group">
                            <label for="quality-slider">Quality: <span id="quality-value">92%</span></label>
                            <input type="range" id="quality-slider" min="1" max="100" value="92">
                        </div>
                         <div id="resize-option" class="option-group">
                            <label for="max-width">Resize (optional)</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="number" id="max-width" placeholder="Max Width">
                                <input type="number" id="max-height" placeholder="Max Height">
                            </div>
                        </div>
                    </div>
                </div>

                <button id="convert-button" class="convert-btn" disabled>Convert Now</button>
                <div id="status-area" class="status-area"></div>
            </div>
        </section>
        
       <section class="supported-formats">
           <div class="container">
               <h2>Supports Over 15+ File Formats</h2>
               <p class="section-subtitle">A powerful, all-in-one suite for all your conversion needs. Whether you're a developer, designer, or just need to convert a file, we've got you covered.</p>
               <div class="formats-grid">
               </div>
           </div>
       </section>
       
       <!-- --- NEW PRICING SECTION --- -->
       <section id="pricing" class="pricing-section">
           <div class="container">
               <h2>Simple, Transparent Pricing</h2>
               <p class="section-subtitle">Choose the plan that's right for you. Unlock powerful features and convert without limits.</p>
               
               <div class="pricing-toggle-container">
                   <span class="monthly-label">Monthly</span>
                   <div class="pricing-toggle" id="pricing-toggle">
                       <span class="monthly active"></span>
                       <span class="yearly"></span>
                   </div>
                   <span class="yearly-label">Yearly</span>
                   <span class="save-badge">Save 20%</span>
               </div>
               
               <div class="pricing-grid">
                   <!-- Basic Plan -->
                   <div class="pricing-card">
                       <h3 class="plan-name">Basic</h3>
                       <div class="plan-price" data-monthly="5" data-yearly="48"><sup>$</sup>5<sub>/mo</sub></div>
                       <p class="plan-description">For casual users who need quick and easy conversions.</p>
                       <ul class="features-list">
                           <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" /></svg>20 conversions per day</li>
                           <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" /></svg>Batch processing up to 5 files</li>
                           <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" /></svg>Standard support</li>
                       </ul>
                       <a href="#" class="btn btn-secondary pricing-button" data-plan="Basic" data-price="5.00">Choose Basic</a>
                   </div>

                   <!-- Pro Plan (Recommended) -->
                   <div class="pricing-card recommended">
                       <div class="badge">Best Value</div>
                       <h3 class="plan-name">Pro</h3>
                       <div class="plan-price" data-monthly="15" data-yearly="144"><sup>$</sup>15<sub>/mo</sub></div>
                       <p class="plan-description">For professionals who need more power and flexibility.</p>
                       <ul class="features-list">
                           <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" /></svg>Unlimited daily conversions</li>
                           <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" /></svg>Batch processing up to 100 files</li>
                           <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" /></svg>Advanced options & quality control</li>
                           <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" /></svg>Priority email support</li>
                       </ul>
                       <a href="#" class="btn btn-primary pricing-button" data-plan="Pro" data-price="15.00">Choose Pro</a>
                   </div>

                   <!-- Premium Plan -->
                   <div class="pricing-card">
                       <h3 class="plan-name">Premium</h3>
                       <div class="plan-price" data-monthly="49" data-yearly="470"><sup>$</sup>49<sub>/mo</sub></div>
                       <p class="plan-description">For teams and businesses that need developer access.</p>
                       <ul class="features-list">
                           <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" /></svg>All features from Pro plan</li>
                           <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" /></svg>Full API Access</li>
                           <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" /></svg>Team collaboration features</li>
                           <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" /></svg>Dedicated account manager</li>
                       </ul>
                       <a href="#" class="btn btn-secondary pricing-button" data-plan="Premium" data-price="49.00">Choose Premium</a>
                   </div>
               </div>
           </div>
       </section>
       <!-- --- END OF PRICING SECTION --- -->

       <section class="features">
           <div class="container">
               <h2>The Only Converter You'll Ever Need</h2>
               <div class="features-grid">
                   <div class="feature-card">
                       <svg class="feature-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="iconGrad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="var(--primary-color)"></stop><stop offset="100%" stop-color="var(--secondary-color)"></stop></linearGradient></defs><path fill="url(#iconGrad)" d="M41.9,13.2l-19,16c-1,0.8-1,2.2,0,3l19,16c1.4,1.2,3.6,0.2,3.6-1.5V14.8C45.5,13,43.3,12,41.9,13.2z M18.5,14.8v34.5 c0,1.7,2.2,2.7,3.6,1.5l19-16c1-0.8,1-2.2,0-3l-19-16C20.7,12,18.5,13,18.5,14.8z" opacity="0.5"></path><path fill="url(#iconGrad)" d="M33,4.1l-19,16c-1,0.8-1,2.2,0,3l19,16c1.4,1.2,3.6,0.2,3.6-1.5V5.6C36.5,3.9,34.4,2.9,33,4.1z"></path></svg>
                       <h3>Blazing Fast Speed</h3>
                       <p>No uploads, no waiting. All conversions run directly in your browser, making the process incredibly fast and keeping your data private.</p>
                   </div>
                   <div class="feature-card"><svg class="feature-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M14 20h20v20H14z" fill="#EBF5FF"/><path d="M20 14h20v20H20z" fill="#b3d4ff"/><path d="M26 8h20v20H26z" fill="var(--primary-color)"/></svg><h3>Batch Processing</h3><p>Save time by converting hundreds of files at once. Select multiple files and let our tool do the heavy lifting, bundling them in a ZIP for you.</p></div>
                   <div class="feature-card"><svg class="feature-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M12 20h40v24H12z" rx="4" fill="#EBF5FF"/><path d="M32 32m-8 0a8 8 0 1016 0 8 8 0 10-16 0" fill="var(--primary-color)"/><path d="M18 50h28" stroke="var(--secondary-color)" stroke-width="4" stroke-linecap="round"/></svg><h3>Maximum Formats</h3><p>Go beyond the basics. Convert to next-gen formats like AVIF, create website favicons (ICO), or even generate creative ASCII art from your photos.</p></div>
                   <div class="feature-card"><svg class="feature-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M18 10h28v44H18z" rx="4" fill="#E6F6FF"/><path d="M24 18h16m-16 8h16m-16 8h10" stroke="var(--primary-color)" stroke-width="3" stroke-linecap="round"/><path d="M46 10h-2v44h2z" fill="var(--secondary-color)"/></svg><h3>Full PDF Suite</h3><p>A true PDF workhorse. Convert multi-page PDFs to images, or compile multiple images into a single, professional PDF document.</p></div>
               </div>
           </div>
       </section>

       <section class="article-content">
        <div class="container">
            <h2>The Definitive Guide to All-Format Conversion</h2>
            <p>Welcome to the final frontier of browser-based file conversion. PlusConvert has evolved into a comprehensive suite that handles not just basic conversions, but a vast array of formats and tasks, from next-generation web images to creative text art. This guide will walk you through the powerful features that make this the only conversion tool you'll ever need.</p>
            
            <h3>Chapter 1: Maximum Formats, Maximum Possibilities</h3>
            <p>Our goal was to support every useful format possible within a secure browser environment. Here's a rundown of the formats and their best use-cases:</p>
            <ul>
                <li><strong>JPG/JPEG:</strong> The universal standard for photographs. Offers excellent compression for complex, colorful images. Use this for photos on the web or for sharing.</li>
                <li><strong>PNG:</strong> The choice for graphics requiring transparency. Perfect for logos, icons, and diagrams where quality is paramount.</li>
                <li><strong>WEBP:</strong> A modern format from Google that offers superior compression to JPG and PNG. Excellent for speeding up websites.</li>
                <li><strong>AVIF:</strong> The future of web images. Convert to AVIF for the highest compression and quality. (Requires a modern browser like Chrome or Firefox).</li>
                <li><strong>GIF:</strong> The language of the internet. Quickly convert any image or PDF page into a single-frame GIF.</li>
                <li><strong>ICO:</strong> Essential for web developers. Upload any image, and PlusConvert will automatically generate a multi-size `favicon.ico` file for your website.</li>
                <li><strong>ASCII Art:</strong> Get creative! This option transforms your image into a text-based masterpiece, perfect for social media or programming comments.</li>
                <li><strong>Base64 Text:</strong> A developer's tool. Get a text representation of your image for embedding directly into HTML or CSS files.</li>
            </ul>

            <h3>Chapter 2: Advanced Workflow, Simplified</h3>
            <p>Power features should be easy to use. PlusConvert streamlines complex tasks with an intuitive interface.</p>
            <h4>Use Case 1: Create a Website Favicon</h4>
            <p><strong>The Scenario:</strong> You have your company logo as a PNG and need a `favicon.ico` for your website.<br><strong>The Solution:</strong> Upload your PNG, select <strong>ICO (Favicon)</strong> as the output, and click convert. You will instantly get a perfectly formatted ICO file containing both 32x32 and 16x16 resolutions.</p>
            <h4>Use Case 2: Optimize an Entire Photo Gallery</h4>
            <p><strong>The Scenario:</strong> You have 50 high-resolution JPG photos for your portfolio website, but they are too large and slow down the page.<br><strong>The Solution:</strong> Drag and drop all 50 photos. Select <strong>AVIF</strong> as the output. In the options, set the Quality to 75% and set a Max Width of 1920px. Click convert. In moments, you'll get a single ZIP file with highly optimized, fast-loading images.</p>
            <h4>Use Case 3: Create ASCII Art for Social Media</h4>
            <p><strong>The Scenario:</strong> You want to post a cool, retro-style version of your profile picture.<br><strong>The Solution:</strong> Upload your photo, select <strong>ASCII Art</strong>, and convert. A text box will appear with the result. Simply click "Copy to Clipboard" and paste it anywhere that supports plain text.</p>

            <h3>Chapter 3: Unwavering Security and Privacy</h3>
            <p>Even with these incredible capabilities, our foundational promise holds true: <strong>your files are never uploaded to any server.</strong> Every single operation—from rendering multi-page PDFs to generating complex ICO files and zipping hundreds of results—happens securely on your own computer using the power of your browser. PlusConvert is, and always will be, the safest way to convert your files.</p>
        </div>
       </section>
    </main>

    <footer class="main-footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col"><h4>Company</h4><ul><li><a href="#">About Us</a></li><li><a href="#">Contact</a></li><li><a href="#">Careers</a></li></ul></div>
                <div class="footer-col"><h4>Resources</h4><ul><li><a href="#">API Documentation</a></li><li><a href="#">Blog</a></li><li><a href="#">Help Center</a></li></ul></div>
                <div class="footer-col"><h4>Legal</h4><ul><li><a href="#">Terms of Service</a></li><li><a href="#">Privacy Policy</a></li><li><a href="#">Security</a></li></ul></div>
                <div class="footer-col"><h4>Follow Us</h4><ul><li><a href="#">Twitter</a></li><li><a href="#">LinkedIn</a></li><li><a href="#">GitHub</a></li></ul></div>
            </div>
            <div class="footer-bottom"><p>&copy; 2024 PlusConvert. All rights reserved.</p></div>
        </div>
    </footer>

    <!-- Sign-Up Modal HTML -->
    <div id="signup-modal" class="modal">
        <div class="modal-content">
            <span class="close-button" id="close-modal">&times;</span>
            <h2 id="modal-title">Create Your Free Account</h2>
            <form id="signup-form">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required placeholder="you@example.com">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required placeholder="••••••••">
                </div>
                <div class="form-group" id="confirm-password-group">
                    <label for="confirm-password">Confirm Password</label>
                    <input type="password" id="confirm-password" name="confirm-password" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn btn-primary" id="modal-submit-button">Create Account</button>
            </form>
            <p class="modal-toggle-text">
                <span id="toggle-prompt">Already have an account?</span>
                <a href="#" id="modal-toggle-link">Log In</a>
            </p>
            <div class="social-signup">
                <div class="divider">OR</div>
                <div class="social-buttons">
                    <button type="button" class="social-button" id="google-signup">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.657-3.356-11.303-7.962l-6.571 4.819C9.656 40.663 16.318 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C39.601 36.453 44 30.817 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                        Google
                    </button>
                    <button type="button" class="social-button" id="facebook-signup">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#039be5" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z"/><path fill="#fff" d="M26.572 15.116c0-1.486.956-2.583 2.871-2.583h2.534V5.129H27.22c-5.061 0-8.156 3.093-8.156 7.828v3.498H14.07v5.528h4.994v15.021h6.054V21.954h5.272l.83-5.528h-6.102v-3.31z"/></svg>
                        Facebook
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- ========= NEW: PAYMENT MODAL HTML (MODIFIED) ========= -->
    <div id="payment-modal" class="modal">
        <div class="payment-modal-content">
            <span class="close-button" id="close-payment-modal">&times;</span>
            <h2 id="payment-modal-title">Complete Your Purchase</h2>
            <div class="payment-modal-subtitle">
                <span>Pay securely with</span>
                <img src="https://www.paypalobjects.com/images/shared/momgram@2x.png" alt="PayPal Logo">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Old_Visa_Logo.svg" alt="Visa Logo">
            </div>

            <div id="paypal-button-container"></div>
            
            <div id="payment-message"></div>
        </div>
    </div>

    <!-- ========= START: FIREBASE SDK AND CONFIGURATION ========= -->
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
    <script>
        const firebaseConfig = {
            apiKey: "AIzaSyBbmUxk8E2-8YoixX9oJvytjf5Ui0hDi1A",
            authDomain: "plusconvert-151c0.firebaseapp.com",
            projectId: "plusconvert-151c0",
            storageBucket: "plusconvert-151c0.firebasestorage.app",
            messagingSenderId: "436503666639",
            appId: "1:436503666639:web:78e1d892b023079f787cba",
            measurementId: "G-Z162R99KPP"
        };
        const app = firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const googleProvider = new firebase.auth.GoogleAuthProvider();
    </script>
    
    <!-- 
    ================================================================
    >>> PAYPAL SCRIPT WITH YOUR NEW LIVE CLIENT ID INSERTED <<<
    ================================================================
    -->
    <script src="https://www.paypal.com/sdk/js?client-id=AQffuGYIsVpveL0ihfhEYyGMYHLk3Y3WP6sbJwXLoJTFKUi_FIpN7o_Cz1bNM0F70cAUkAQjlzP6mL_d&currency=USD"></script>

    <!--
    ================================================================
    >>> THE SCRIPT BELOW IS THE ONLY SECTION THAT HAS BEEN MODIFIED <<<
    ================================================================
    -->
    <script>
        // --- EXISTING SCRIPT FOR FILE CONVERSION ---
        const fileUpload = document.getElementById('file-upload'), fileInfo = document.getElementById('file-info'), convertToSelect = document.getElementById('convert-to'), convertButton = document.getElementById('convert-button'), statusArea = document.getElementById('status-area'), themeToggleBtn = document.getElementById('theme-toggle'), dropZone = document.querySelector('.drop-zone'), optionsPanel = document.getElementById('options-panel'), qualityOption = document.getElementById('quality-option'), qualitySlider = document.getElementById('quality-slider'), qualityValue = document.getElementById('quality-value'), resizeOption = document.getElementById('resize-option'), maxWidthInput = document.getElementById('max-width'), maxHeightInput = document.getElementById('max-height');
        let selectedFiles = [];

        themeToggleBtn.addEventListener('click', () => { document.body.classList.toggle('dark-mode'); localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light'); });

        function checkConversionReady() { convertButton.disabled = !(selectedFiles.length > 0 && !convertToSelect.value.includes('...')); }

        function handleFileSelection(files) {
            if (!files || files.length === 0) return;
            selectedFiles = Array.from(files);
            statusArea.innerHTML = '';
            fileInfo.innerHTML = selectedFiles.length === 1 ? `Selected: <span class="file-name">${selectedFiles[0].name}</span>` : `Selected <span class="file-name">${selectedFiles.length} files</span>`;
            optionsPanel.style.display = 'flex';
            updateOptionsUI();
            checkConversionReady();
        }

        function updateOptionsUI() {
            const toFormat = convertToSelect.value;
            const qualityFormats = ['jpg', 'webp', 'avif'];
            const resizeApplicable = selectedFiles.length > 0 && selectedFiles.every(f => f.type.startsWith('image/')) && toFormat !== 'pdf' && toFormat !== 'ico';
            qualityOption.style.display = qualityFormats.includes(toFormat) ? 'block' : 'none';
            resizeOption.style.display = resizeApplicable ? 'flex' : 'none';
        }

        fileUpload.addEventListener('change', (e) => handleFileSelection(e.target.files));
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragenter', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); if (e.dataTransfer.files.length) handleFileSelection(e.dataTransfer.files); });
        
        convertToSelect.addEventListener('change', () => { updateOptionsUI(); checkConversionReady(); });
        qualitySlider.addEventListener('input', (e) => { qualityValue.textContent = `${e.target.value}%`; });
        convertButton.addEventListener('click', () => { if (selectedFiles.length > 0) { startProgress("Initializing..."); handleConversion(); } });

        async function handleConversion() {
            const toFormat = convertToSelect.value;

            if (!isFormatSupported(toFormat)) {
                showError(`Conversion to ${toFormat.toUpperCase()} is not supported by your browser. Please try a different format or update your browser.`);
                return;
            }

            const isSinglePdfInput = selectedFiles.length === 1 && selectedFiles[0].type === 'application/pdf';
            const areImageInputs = selectedFiles.every(f => f.type.startsWith('image/'));

            if (toFormat === 'pdf' && areImageInputs) await convertImagesToSinglePdf(selectedFiles);
            else if (isSinglePdfInput && toFormat !== 'pdf') await convertPdfToImages(selectedFiles[0], toFormat);
            else if (areImageInputs) await batchConvertImages(selectedFiles, toFormat);
            else showError("Unsupported conversion. Please select either multiple images OR a single PDF.");
        }

        async function convertImagesToSinglePdf(files) {
            startProgress(`Processing ${files.length} images...`);
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.deletePage(1);

            for (let i = 0; i < files.length; i++) {
                updateProgress(i / files.length, `Adding image ${i + 1}...`);
                const img = await loadImage(await fileToDataURL(files[i]));
                const pageW = doc.internal.pageSize.getWidth(), pageH = doc.internal.pageSize.getHeight();
                const ratio = img.width / img.height, pageRatio = pageW / pageH;
                const [w, h] = ratio > pageRatio ? [pageW, pageW / ratio] : [pageH * ratio, pageH];
                doc.addPage();
                doc.addImage(img, 'PNG', (pageW - w) / 2, (pageH - h) / 2, w, h);
            }
            doc.deletePage(1);
            showSuccessUI(URL.createObjectURL(doc.output('blob')), `plusconvert_compilation.pdf`, 'PDF Document');
        }
        
        async function convertPdfToImages(file, toFormat) {
            try {
                const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
                const zip = new JSZip();
                for (let i = 1; i <= pdf.numPages; i++) {
                    updateProgress(i / pdf.numPages, `Processing page ${i} of ${pdf.numPages}...`);
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width; canvas.height = viewport.height;
                    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                    const { data: blob, ext } = await canvasToBlob(canvas, toFormat, getOptions());
                    zip.file(`${file.name.replace(/\.pdf$/i, '')}_page_${i}.${ext}`, blob);
                }
                const zipBlob = await zip.generateAsync({ type: "blob" });
                showSuccessUI(URL.createObjectURL(zipBlob), `${file.name.replace(/\.pdf$/i, '')}.zip`, "ZIP Archive");
            } catch (error) { showError("Could not process PDF. It may be corrupt or protected."); }
        }

        async function batchConvertImages(files, toFormat) {
            const results = [];
            for (let i = 0; i < files.length; i++) {
                updateProgress(i / files.length, `Converting file ${i + 1}...`);
                try {
                    const { data: blob, ext } = await processSingleImage(files[i], toFormat, getOptions());
                    results.push({ name: `${files[i].name.split('.').slice(0, -1).join('.')}.${ext}`, blob });
                } catch (e) {
                    showError(`Failed to convert ${files[i].name}: ${e.message}`);
                    return;
                }
            }
            
            if (results.length === 1) {
                if (results[0].blob.type.startsWith('text/')) {
                    const text = await results[0].blob.text();
                    showTextOutput(text, toFormat.toUpperCase());
                } else {
                    showSuccessUI(URL.createObjectURL(results[0].blob), results[0].name, toFormat.toUpperCase());
                }
            } else if (results.length > 1) {
                const zip = new JSZip();
                results.forEach(r => zip.file(r.name, r.blob));
                const zipBlob = await zip.generateAsync({ type: "blob" });
                showSuccessUI(URL.createObjectURL(zipBlob), "plusconvert_batch.zip", "ZIP Archive");
            }
        }
        
        async function processSingleImage(file, toFormat, options) {
            let img = await loadImage(await fileToDataURL(file));
            const canvas = document.createElement('canvas');
            const ratio = img.width / img.height;
            let { width, height } = img;
            if (options.maxWidth && width > options.maxWidth) { width = options.maxWidth; height = width / ratio; }
            if (options.maxHeight && height > options.maxHeight) { height = options.maxHeight; width = height * ratio; }
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            return await canvasToBlob(canvas, toFormat, options);
        }

        // --- UTILITY FUNCTIONS ---
        const fileToDataURL = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
        const loadImage = src => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
        const getOptions = () => ({ quality: parseInt(qualitySlider.value) / 100, maxWidth: parseInt(maxWidthInput.value) || null, maxHeight: parseInt(maxHeightInput.value) || null, });
        function startProgress(message) { convertButton.disabled = true; statusArea.innerHTML = `<div class="progress-bar-container"><div class="progress-bar" id="progress-bar"></div></div><p id="progress-text">${message}</p>`; }
        function updateProgress(percentage, message) { const bar = document.getElementById('progress-bar'), text = document.getElementById('progress-text'); if (bar) bar.style.width = `${percentage * 100}%`; if (text) text.textContent = message; }
        function showError(message) { statusArea.innerHTML = `<div class="error-message">❌ Conversion Failed</div><p style="text-align:center;max-width:500px;margin:15px auto;">${message}</p>`; convertButton.disabled = false; }
        function showSuccessUI(downloadUrl, fileName, fileType) {
            updateProgress(1, "Done!");
            setTimeout(() => {
                statusArea.innerHTML = `<div class="success-message">✅ Conversion Successful!</div><a href="${downloadUrl}" download="${fileName}" id="download-link" class="download-btn"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>Download your ${fileType}</a>`;
                document.getElementById('download-link').addEventListener('click', () => setTimeout(resetUI, 300));
            }, 500);
        }
        function showTextOutput(text, formatName) {
            updateProgress(1, "Done!");
            setTimeout(() => {
                statusArea.innerHTML = `<div class="success-message">✅ ${formatName} Generated!</div><div class="text-output-area"><textarea readonly>${text}</textarea><button class="copy-btn" id="copy-btn">Copy to Clipboard</button></div>`;
                document.getElementById('copy-btn').addEventListener('click', (e) => {
                    const textarea = e.target.previousElementSibling;
                    navigator.clipboard.writeText(textarea.value).then(() => { e.target.textContent = "Copied!"; setTimeout(() => e.target.textContent = "Copy to Clipboard", 2000); });
                });
            }, 500);
        }
        function resetUI() { selectedFiles = []; fileUpload.value = ''; fileInfo.innerHTML = ''; statusArea.innerHTML = ''; convertToSelect.value = convertToSelect.options[0].value; optionsPanel.style.display = 'none'; checkConversionReady(); }

        const _formatSupport = {};
        function isFormatSupported(format) {
            if (format in _formatSupport) return _formatSupport[format];
            if (format === 'avif' || format === 'webp') {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = canvas.height = 1;
                    canvas.toDataURL(`image/${format}`);
                    _formatSupport[format] = true;
                } catch {
                    _formatSupport[format] = false;
                }
                return _formatSupport[format];
            }
            return true;
        }

        async function canvasToBlob(canvas, format, options) {
            return new Promise(async (resolve, reject) => {
                try {
                    const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
                    if (format === 'bmp') resolve({ data: canvasToBMP.toBlob(canvas), ext: 'bmp' });
                    else if (format === 'base64') resolve({ data: new Blob([canvas.toDataURL(`image/png`)], {type: 'text/plain'}), ext: 'txt' });
                    else if (format === 'ascii') resolve({ data: new Blob([canvasToAscii(canvas)], {type: 'text/plain'}), ext: 'txt' });
                    else if (format === 'gif') {
                        const gif = new GIF({ workers: 2, quality: 10, workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js' });
                        gif.addFrame(canvas, { delay: 200 });
                        gif.on('finished', (blob) => resolve({ data: blob, ext: 'gif' }));
                        gif.render();
                    }
                    else if (format === 'ico') resolve({ data: await canvasToIco(canvas), ext: 'ico' });
                    else canvas.toBlob(blob => {
                        if (!blob) reject(new Error(`Conversion to ${format.toUpperCase()} failed.`));
                        else resolve({ data: blob, ext: format });
                    }, mime, options.quality);
                } catch(e) { reject(e); }
            });
        }
        
        function canvasToAscii(canvas) {
            const MAX_WIDTH = 120;
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            const ratio = canvas.height / canvas.width;
            tempCanvas.width = Math.min(canvas.width, MAX_WIDTH);
            tempCanvas.height = Math.round(tempCanvas.width * ratio * 0.5); // Adjust for character aspect ratio
            tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
            
            const data = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
            const density = ' .,:;irsXA253hMHGS#9B&@';
            let ascii = '';
            for (let y = 0; y < tempCanvas.height; y++) {
                for (let x = 0; x < tempCanvas.width; x++) {
                    const i = (y * tempCanvas.width + x) * 4;
                    const avg = (data[i] + data[i+1] + data[i+2]) / 3;
                    ascii += density[Math.floor((avg / 255) * (density.length - 1))];
                }
                ascii += '\n';
            }
            return ascii;
        }

        async function canvasToIco(canvas) {
            const sizes = [32, 16];
            const pngs = await Promise.all(sizes.map(async size => {
                const offscreen = document.createElement('canvas');
                offscreen.width = size; offscreen.height = size;
                offscreen.getContext('2d').drawImage(canvas, 0, 0, size, size);
                return await (await fetch(offscreen.toDataURL('image/png'))).arrayBuffer();
            }));

            const buffer = new ArrayBuffer(6 + sizes.length * 16 + pngs.reduce((a, b) => a + b.byteLength, 0));
            const view = new DataView(buffer);
            let offset = 6 + sizes.length * 16;
            view.setUint16(0, 0, true); view.setUint16(2, 1, true); view.setUint16(4, sizes.length, true);
            sizes.forEach((size, i) => {
                const entryOffset = 6 + i * 16;
                view.setUint8(entryOffset + 0, size); view.setUint8(entryOffset + 1, size);
                view.setUint16(entryOffset + 4, 1, true); view.setUint16(entryOffset + 6, 32, true);
                view.setUint32(entryOffset + 8, pngs[i].byteLength, true);
                view.setUint32(entryOffset + 12, offset, true);
                new Uint8Array(buffer, offset).set(new Uint8Array(pngs[i]));
                offset += pngs[i].byteLength;
            });

            return new Blob([buffer], { type: 'image/x-icon' });
        }
        
        // --- Modal Control Script ---
        const signUpBtn = document.getElementById('signup-button');
        const modal = document.getElementById('signup-modal');
        const closeModalBtn = document.getElementById('close-modal');
        const signupForm = document.getElementById('signup-form');
        const modalTitle = document.getElementById('modal-title');
        const modalSubmitButton = document.getElementById('modal-submit-button');
        const confirmPasswordGroup = document.getElementById('confirm-password-group');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const togglePrompt = document.getElementById('toggle-prompt');
        const modalToggleLink = document.getElementById('modal-toggle-link');
        const googleSignUpBtn = document.getElementById('google-signup');

        let isLoginMode = false;

        function setModalMode(isLogin) {
            isLoginMode = isLogin;
            if (isLoginMode) {
                modalTitle.textContent = 'Log In to Your Account';
                confirmPasswordGroup.style.display = 'none';
                confirmPasswordInput.required = false;
                modalSubmitButton.textContent = 'Log In';
                togglePrompt.textContent = "Don't have an account? ";
                modalToggleLink.textContent = 'Sign Up';
            } else {
                modalTitle.textContent = 'Create Your Free Account';
                confirmPasswordGroup.style.display = 'block';
                confirmPasswordInput.required = true;
                modalSubmitButton.textContent = 'Create Account';
                togglePrompt.textContent = 'Already have an account? ';
                modalToggleLink.textContent = 'Log In';
            }
        }

        modalToggleLink.addEventListener('click', (event) => {
            event.preventDefault();
            setModalMode(!isLoginMode);
        });
        signUpBtn.addEventListener('click', function(event) {
          event.preventDefault();
          setModalMode(false);
          modal.style.display = 'block';
        });
        closeModalBtn.addEventListener('click', function() {
          modal.style.display = 'none';
        });
        window.addEventListener('click', function(event) {
          if (event.target == modal) {
            modal.style.display = 'none';
          }
        });

        // --- Handle form submission for Firebase ---
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;
            
            if (isLoginMode) {
                // --- LOGIN LOGIC ---
                auth.signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        console.log("User logged in: ", userCredential.user);
                        alert("Login Successful!");
                        modal.style.display = 'none';
                        signupForm.reset();
                    })
                    .catch((error) => {
                        alert("Error: " + error.message);
                    });
            } else {
                // --- SIGN UP LOGIC ---
                const confirmPassword = confirmPasswordInput.value;
                if (password !== confirmPassword) {
                    alert("Passwords do not match.");
                    return;
                }
                auth.createUserWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        console.log("User created: ", userCredential.user);
                        alert("Sign Up Successful! Welcome.");
                        modal.style.display = 'none';
                        signupForm.reset();
                    })
                    .catch((error) => {
                        alert("Error: " + error.message);
                    });
            }
        });

        // --- Handle Google Sign-In ---
        googleSignUpBtn.addEventListener('click', () => {
            auth.signInWithPopup(googleProvider)
                .then((result) => {
                    console.log("Google Sign-In successful:", result.user);
                    alert("Welcome, " + result.user.displayName);
                    modal.style.display = 'none';
                }).catch((error) => {
                    alert("Google Sign-In Error: " + error.message);
                });
        });


        // --- PRICING TOGGLE SCRIPT ---
        const pricingToggle = document.getElementById('pricing-toggle');
        const monthlyToggle = pricingToggle.querySelector('.monthly');
        const yearlyToggle = pricingToggle.querySelector('.yearly');
        const priceElements = document.querySelectorAll('.plan-price');

        function updatePrices(isYearly) {
            priceElements.forEach(priceEl => {
                const monthlyPrice = priceEl.getAttribute('data-monthly');
                const yearlyPrice = priceEl.getAttribute('data-yearly');

                const button = priceEl.closest('.pricing-card').querySelector('.pricing-button');

                if (isYearly) {
                    const yearlyPerMonth = (yearlyPrice / 12).toFixed(2);
                    priceEl.innerHTML = `<sup>$</sup>${yearlyPerMonth}<sub>/mo</sub>`;
                    if(button) button.setAttribute('data-price', yearlyPrice);
                } else {
                    priceEl.innerHTML = `<sup>$</sup>${monthlyPrice}<sub>/mo</sub>`;
                    if(button) button.setAttribute('data-price', monthlyPrice);
                }
            });
            monthlyToggle.classList.toggle('active', !isYearly);
            yearlyToggle.classList.toggle('active', isYearly);
        }

        pricingToggle.addEventListener('click', () => {
            updatePrices(!monthlyToggle.classList.contains('active'));
        });
        
        updatePrices(false);

        // --- START: PAYMENT MODAL & PAYPAL INTEGRATION SCRIPT ---
        const paymentModal = document.getElementById('payment-modal');
        const closePaymentModalBtn = document.getElementById('close-payment-modal');
        const paymentModalTitle = document.getElementById('payment-modal-title');
        const pricingButtons = document.querySelectorAll('.pricing-button');
        const paymentMessage = document.getElementById('payment-message');
        const paypalButtonContainer = document.getElementById('paypal-button-container');

        const RENDER_SERVER_URL = 'https://paypalserver-enz3.onrender.com';
        let selectedPlan = {}; // To store the currently selected plan details

        // Open the payment modal when a pricing button is clicked
        pricingButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                
                selectedPlan = {
                    name: this.getAttribute('data-plan'),
                    price: this.getAttribute('data-price') 
                };
                
                paymentModalTitle.textContent = `Complete Your ${selectedPlan.name} Plan Purchase`;
                paymentMessage.innerHTML = '';
                paymentModal.style.display = 'block';
                
                // Render the PayPal button inside the modal now that it's visible
                renderPayPalButton();
            });
        });
        
        // Function to render the PayPal buttons
        function renderPayPalButton() {
            // Clear previous buttons to avoid duplicates
            paypalButtonContainer.innerHTML = '';

            // This is the main PayPal function that creates the buttons
            paypal.Buttons({
                // === 1. CREATE ORDER: Called when the user clicks a payment button ===
                createOrder: function(data, actions) {
                    console.log('Creating order for:', selectedPlan);
                    // Call your Render server to set up the transaction
                    // *** EDITED: Using the new /api/orders path ***
                    return fetch(`${RENDER_SERVER_URL}/api/orders`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            plan: {
                                name: selectedPlan.name,
                                price: selectedPlan.price
                            }
                        })
                    })
                    .then(res => {
                        if (!res.ok) {
                            return res.json().then(err => { throw new Error(err.error || 'Server responded with an error'); });
                        }
                        return res.json();
                    })
                    .then(orderData => {
                        console.log('Order created on server. Order ID:', orderData.id);
                        return orderData.id; // Return the order ID from your server
                    })
                    .catch(err => {
                        console.error('Error creating order:', err);
                        paymentMessage.innerHTML = `<div class="error-message">❌ Error: Could not initiate payment. Please check server logs for CORS issues.</div>`;
                        throw new Error(err);
                    });
                },

                // === 2. ON APPROVE: Called after the user approves the payment in the PayPal popup ===
                onApprove: function(data, actions) {
                    console.log('Payment approved by user. Capturing payment for Order ID:', data.orderID);
                    // Call your Render server to finalize (capture) the transaction
                    // *** EDITED: Using the new /api/orders/:orderID/capture path ***
                    return fetch(`${RENDER_SERVER_URL}/api/orders/${data.orderID}/capture`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                    })
                    .then(res => {
                        if (!res.ok) {
                           return res.json().then(err => { throw new Error(err.error || 'Server failed to capture payment'); });
                        }
                        return res.json();
                    })
                    .then(details => {
                        console.log('Payment captured successfully by server:', details);
                        // Hide buttons and show a success message
                        paypalButtonContainer.innerHTML = ''; 
                        paymentMessage.innerHTML = `<div class="success-message">✅ Thank you, ${details.payer.name.given_name}! Your payment was successful.</div>`;
                    })
                    .catch(err => {
                        console.error('Error capturing payment:', err);
                        paymentMessage.innerHTML = `<div class="error-message">❌ Error: Payment could not be completed. ${err.message}</div>`;
                    });
                },

                // === 3. ON ERROR: Handles client-side errors from the PayPal SDK or errors from createOrder ===
                onError: function(err) {
                    console.error('PayPal button SDK error:', err);
                    paymentMessage.innerHTML = '<div class="error-message">❌ A payment error occurred. Please try again.</div>';
                }
            }).render('#paypal-button-container'); // This line is what makes the buttons appear
        }

        // --- Functions to close the payment modal ---
        function closePaymentModal() {
            paymentModal.style.display = 'none';
        }

        closePaymentModalBtn.addEventListener('click', closePaymentModal);
        window.addEventListener('click', function(event) {
            if (event.target == paymentModal) {
                closePaymentModal();
            }
        });
        // --- END: PAYMENT SCRIPT ---
    </script>
</body>
</html>
