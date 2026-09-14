import express from 'express';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global CORS Middleware
app.use((req, res, next) => {
  // Replace '*' with 'https://YOUR_USERNAME.github.io' for extra security
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Proxy Route
app.post('/api/airtime', async (req, res) => {
  try {
    const { project, recipients } = req.body;

    if (!project || !recipients) {
      return res.status(400).json({ 
        error: 'Missing required fields: project and recipients are required.' 
      });
    }

    const apiKey = process.env.SOZURI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'SOZURI_API_KEY is not configured on the proxy server.' 
      });
    }

    // Format body as x-www-form-urlencoded expected by Sozuri
    const bodyParams = new URLSearchParams();
    bodyParams.append('project', project);
    bodyParams.append('recipients', typeof recipients === 'string' ? recipients : JSON.stringify(recipients));

    const sozuriResponse = await fetch('https://sozuri.net/api/v1/airtime/topup', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${apiKey}`
      },
      body: bodyParams
    });

    const data = await sozuriResponse.json();
    return res.status(sozuriResponse.status).json(data);

  } catch (err) {
    console.error('Sozuri Proxy Error:', err);
    return res.status(500).json({ 
      error: 'Failed to communicate with Sozuri API',
      details: err.message 
    });
  }
});

// Export Express app as Vercel handler
export default app;
