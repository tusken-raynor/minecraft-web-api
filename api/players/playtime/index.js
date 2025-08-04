const fs = require('fs');

const SERVER_PATH = process.env.SERVER_PATH;

module.exports = {
  get(req, res) {
    // Read the join and leave entries from the minecraft-server/logs/latest.log file
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
            players[player].playtime += evaluateTime(players[player].joinTime, players[player].leaveTime, startTime, endTime);
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
  }
}

function evaluateTime(joinTime, leaveTime, startTime = '00:00:00', endTime = '23:59:59') {
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