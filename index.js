require('dotenv').config(); // ← Load .env variables first
const express = require('express');
const { Rcon } = require('rcon-client');

const app = express();
const PORT = 52341;

const RCON_OPTIONS = {
  host: '127.0.0.1',
  port: 25575,
  password: process.env.RCON_PASSWORD, // ← Now sourced from .env
};

app.get('/', (req, res) => {
  res.send('Hello from web API');
});

app.get('/players', async (req, res) => {
  const rcon = new Rcon(RCON_OPTIONS);
  try {
    await rcon.connect();
    const response = await rcon.send('list');
    await rcon.end();
    res.send({ success: true, response });
  } catch (error) {
    console.error('RCON error:', error);
    res.status(500).send({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

