require('dotenv').config(); // ← Load .env variables first
const express = require('express');
const securityLayer = require('./security');
const rconClient = require('./rcon');
const rcon = require('./rcon');
const endpoints = require('./api');
const watch = require('./dispatcher');

const app = express();
const PORT = 52341;

const RCON_OPTIONS = {
  host: '127.0.0.1',
  port: 25575,
  password: process.env.RCON_PASSWORD, // ← Now sourced from .env
};
const SERVER_PATH = process.env.SERVER_PATH;

// Apply security layer middleware
app.use(securityLayer); 
// Initialize RCON connection middleware
app.use(rcon.initialize.bind({ 
  options: RCON_OPTIONS
})); 
// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello from web API');
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(`${__dirname}/favicon.ico`);
});

for (let [path, handler] of Object.entries(endpoints)) {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  if (!path.endsWith('/')) {
    path += '/';
  }
  const fullPath = `/api${path}`;
  for (const key in handler) {
    const method = key.toLowerCase();
    if (method in app) {
      const methodHandler = handler[key];
      app[method](fullPath, methodHandler);
    }
  }
}

app.get('/players', async (req, res) => {
  if (!rconClient.connected()) {
    return res.status(503).send({ success: false, message: 'RCON not connected' });
  }
  const rcon = rconClient.get();
  const response = await rcon.send('list');
  const messageParts = response.match(/(\d+) of a max of (\d+) players online: (.+)/);
  const playerCount = messageParts ? parseInt(messageParts[1], 10) : 0;
  const maxPlayers = messageParts ? parseInt(messageParts[2], 10) : 0;
  const players = messageParts ? messageParts[3].split(', ') : [];
  res.send({ success: true, data: { playerCount, maxPlayers, players } });
});

app.get('/players/playtime', async (req, res) => {
  // Read the join and leave entries from the minecraft-server/logs/latest.log file
  const fs = require('fs');
  const logFilePath = `${SERVER_PATH}/logs/latest.log`;

  const startQuery = req.query.start;
  const endQuery = req.query.end;

  // Throw an error if the start query or end query is not in HH:MM:SS format
  const timeRegex = /^([01]\d|2[0-3]):([05]\d|[0-5]\d):([0-5]\d)$/;
  if (startQuery && !timeRegex.test(startQuery)) {
    return res.status(400).send({ success: false, message: 'Invalid start time format. Use HH:MM:SS.' });
  }
  if (endQuery && !timeRegex.test(endQuery)) {
    return res.status(400).send({ success: false, message: 'Invalid end time format. Use HH:MM:SS.' });
  }

  const startTime = startQuery || '00:00:00'; // Default to start of the log if not provided
  let endTime = endQuery || null;
  
  // Get now time in HH:MM:SS format in UTC
  const now = new Date();
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  const nowTime = `${hours}:${minutes}:${seconds}`; // HH:MM:SS
  // If end time is not provided, or end time is after the current time, use the current time
  if (!endTime || endTime > nowTime) {
    endTime = nowTime;
  }

  const evaluateTime = (joinTime, leaveTime) => {
    // If both times are not set, return 0
    if (!joinTime && !leaveTime) return 0;
    // If the joinTime is after the end time, return 0
    if (joinTime && joinTime > endTime) return 0;
    // If joinTime is before startTime, set it to startTime
    if (joinTime && joinTime < startTime) {
      joinTime = startTime; // Use start time as join time
    }
    // If the leaveTime is after the end time, set it to the end time
    if (leaveTime && leaveTime > endTime) {
      leaveTime = endTime; // Use end time as leave time
    }
    // If joinTime is not set, assume player joined at the start of the log
    if (!joinTime) {
      joinTime = startTime; // Default to start of the log
    }
    // If only leaveTime is set, assume player is still online
    else if (!leaveTime) {
      leaveTime = endTime; // Use end time as leave time
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
        players[player].playtime += evaluateTime(players[player].joinTime, endTime);
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

function minecraftTimeToClock(ticks) {
  // Minecraft day starts at 0, which we'll call 6 AM
  // So shift time by 6000 ticks to align 0 = midnight
  const shiftedTicks = (ticks + 6000) % 24000;
  const hours = Math.floor(shiftedTicks / 1000);
  const minutes = Math.floor((shiftedTicks % 1000) * 60 / 1000);
  
  let hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const amOrPm = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) {
    hh = String(hours - 12).padStart(2, '0');
  } else if (hours === 0) {
    hh = '12'; // Midnight case
  }

  return `${hh}:${mm} ${amOrPm}`;
}

app.get('/world-time', async (req, res) => {
  if (!rconClient.connected()) {
    return res.status(503).send({ success: false, message: 'RCON not connected' });
  }
  const rcon = rconClient.get();
  try {
    const response = await rcon.send('time query daytime');
    const match = response.match(/\d+/);
    if (!match) return res.status(500).json({ success: false, message: 'Could not parse time' });

    const ticks = parseInt(match[0], 10);
    const clockTime = minecraftTimeToClock(ticks);
    res.json({ success: true, data: { ticks, time: clockTime } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to query Minecraft time' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

// Setup the server event dispatcher module
watch(10);