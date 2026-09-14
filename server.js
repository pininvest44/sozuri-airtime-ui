import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({ origin: '*' })); // Replace '*' with your GitHub Pages URL for production
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/airtime', async (req, res) => {
  try {
    const { project, recipients } = req.body;

    if (!project || !recipients) {
      return res.status(400).json({ error: 'Missing project or recipients' });
    }

    const apiKey = process.env.SOZURI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SOZURI_API_KEY is not set on the server.' });
    }

    const bodyParams = new URLSearchParams();
    bodyParams.append('project', project);
    bodyParams.append('recipients', typeof recipients === 'string' ? recipients : JSON.stringify(recipients));

    const response = await fetch('https://sozuri.net/api/v1/airtime/topup', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${apiKey}`
      },
      body: bodyParams
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// Bind to process.env.PORT for Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy listening on port ${PORT}`);
});
