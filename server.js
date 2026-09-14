import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Secure Proxy Endpoint
app.post('/api/airtime', async (req, res) => {
  try {
    const { project, recipients } = req.body;

    if (!project || !recipients) {
      return res.status(400).json({ error: 'Missing required parameters: project and recipients' });
    }

    const apiKey = process.env.SOZURI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SOZURI_API_KEY is not configured on the Render server.' });
    }

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

  } catch (error) {
    console.error('Sozuri Proxy Error:', error);
    return res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// Fallback to index.html for root requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Render Port Binding
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
