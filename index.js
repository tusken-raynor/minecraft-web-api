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
    const messageParts = response.match(/(\d+) of (\d+) players online: (.+)/);
    const playerCount = messageParts ? parseInt(messageParts[1], 10) : 0;
    const maxPlayers = messageParts ? parseInt(messageParts[2], 10) : 0;
    const players = messageParts ? messageParts[3].split(', ') : [];
    res.send({ success: true, data: { playerCount, maxPlayers, players } });
  } catch (error) {
    console.error('RCON error:', error);
    res.status(500).send({ success: false, message: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

