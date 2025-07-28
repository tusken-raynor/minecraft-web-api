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
    const messageParts = response.match(/(\d+) of a max of (\d+) players online: (.+)/);
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

  // Get now time in HH:MM:SS format in GMT timezone
  const now = new Date();
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  const nowTime = `${hours}:${minutes}:${seconds}`; // HH:MM:SS

  const evaluateTime = (joinTime, leaveTime) => {
    // If both times are not set, return 0
    if (!joinTime && !leaveTime) return 0;
    // If joinTime is not set, assume player joined at the start of the log
    if (!joinTime) {
      joinTime = '00:00:00'; // Default to start of the log
    }
    // If only leaveTime is set, assume player is still online
    else if (!leaveTime) {
      leaveTime = nowTime; // Use current time as leave time
    }

    // Convert time string so seconds can be calculated
    const parseTime = (timeStr) => {
      const [hours, minutes, seconds] = timeStr.split(':').map(Number);
      return (hours * 3600 + minutes * 60 + seconds); // Convert to seconds
    };
    const joinTimeMs = parseTime(joinTime);
    const leaveTimeMs = parseTime(leaveTime);

    // Calculate playtime in seconds
    const playtimeMs = leaveTimeMs - joinTimeMs;
    return playtimeMs > 0 ? Math.floor(playtimeMs) : 0; // Ensure non-negative playtime
  };

  try {
    const logData = fs.readFileSync(logFilePath, 'utf8');
    const joinLeaveRegex = /(\d{2}:\d{2}:\d{2})\] \[Server thread\/INFO\]: (\w+) (joined|left) the game/;

    const players = {};
    logData.split('\n').forEach(line => {
      const match = line.match(joinLeaveRegex);
      if (match) {
        const [_, time, player, action] = match;
        if (!players[player]) {
          players[player] = { joinTime: null, leaveTime: null, playtime: 0, isOnline: false };
        }
        if (action === 'joined') {
          players[player].joinTime = time;
        } else {
          players[player].leaveTime = time;
        }
        // If the leave time is set, do an evaluation of playtime
        if (players[player].leaveTime) {
          players[player].playtime += evaluateTime(players[player].joinTime, players[player].leaveTime);
          // Reset join and leave times after evaluation
          players[player].joinTime = null;
          players[player].leaveTime = null;
        }
      }
    });
    // If any player is still online, evaluate their playtime with the current time
    Object.keys(players).forEach(player => {
      if (players[player].joinTime && !players[player].leaveTime) {
        players[player].playtime += evaluateTime(players[player].joinTime, nowTime);
        players[player].isOnline = true; // Mark player as online
      }
    });

    // Calculate playtime
    const playtimeData = Object.entries(players).map(([player, times]) => {
      const hours = Math.floor(times.playtime / 3600);
      const minutes = Math.floor((times.playtime % 3600) / 60);
      const seconds = times.playtime % 60;
      const playtime = `${hours}h ${minutes}m ${seconds}s`;
      const totalSeconds = times.playtime;
      return { user: player, playtime, totalSeconds, isOnline: times.isOnline };
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

