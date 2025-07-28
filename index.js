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
const SERVER_PATH = process.env.SERVER_PATH;

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

app.get('/players/playtime', async (req, res) => {
  // Read the join and leave entries from the minecraft-server/logs/latest.log file
  const fs = require('fs');
  const logFilePath = `${SERVER_PATH}/logs/latest.log`;
  try {
    const logData = fs.readFileSync(logFilePath, 'utf8');
    const joinRegex = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[Server thread\/INFO\]: (\w+) joined the game/;
    const leaveRegex = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[Server thread\/INFO\]: (\w+) left the game/;

    const players = {};
    logData.split('\n').forEach(line => {
      const joinMatch = line.match(joinRegex);
      const leaveMatch = line.match(leaveRegex);
      if (joinMatch) {
        const [_, timestamp, player] = joinMatch;
        players[player] = { joinTime: new Date(timestamp), leaveTime: null };
      } else if (leaveMatch) {
        const [_, timestamp, player] = leaveMatch;
        if (players[player]) {
          players[player].leaveTime = new Date(timestamp);
        }
      }
    });

    // Calculate playtime
    const playtimeData = Object.entries(players).map(([player, times]) => {
      const playtime = times.leaveTime ? (times.leaveTime - times.joinTime) / 1000 : null; // in seconds
      return { player, playtime };
    });

    res.send({ success: true, data: playtimeData });
  } catch (error) {
    console.error('Error reading log file:', error);
    res.status(500).send({ success: false, message: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

