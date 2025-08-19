import fs from 'fs';
import { env } from '$env/dynamic/private';

type PlayerData = {
  joinTime: string | null;
  leaveTime: string | null;
  playtime: number; // in seconds
  isOnline: boolean;
};

export default async (startQuery?: string, endQuery?: string) => {
  const logFilePath = `${env.SERVER_PATH}/logs/latest.log`;

  const timeRegex = /^([01]\d|2[0-3]):([05]\d|[0-5]\d):([0-5]\d)$/;
  if (startQuery && !timeRegex.test(startQuery)) {
    throw new Error('Invalid start time format. Use HH:MM:SS.');
  }
  if (endQuery && !timeRegex.test(endQuery)) {
    throw new Error('Invalid end time format. Use HH:MM:SS.');
  }

  const startTime = startQuery || '00:00:00';
  let endTime = endQuery || null;

  const now = new Date();
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  const nowTime = `${hours}:${minutes}:${seconds}`;
  if (!endTime || endTime > nowTime) {
    endTime = nowTime;
  }

  try {
    const logData = await fs.promises.readFile(logFilePath, 'utf8');
    const joinLeaveRegex = /(\d{2}:\d{2}:\d{2})\] \[Server thread\/INFO\]: (\w+) (joined|left) the game/;

    const players: Record<string, PlayerData> = {};
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
        if (players[player].leaveTime) {
          players[player].playtime += evaluateTime(players[player].joinTime, players[player].leaveTime, startTime, endTime);
          players[player].joinTime = null;
          players[player].leaveTime = null;
        }
      }
    });
    Object.keys(players).forEach(player => {
      if (players[player].joinTime && !players[player].leaveTime) {
        players[player].playtime += evaluateTime(players[player].joinTime, endTime);
        players[player].isOnline = true;
      }
    });

    const playtimeData = Object.entries(players).map(([player, times]) => {
      const hours = Math.floor(times.playtime / 3600);
      const minutes = Math.floor((times.playtime % 3600) / 60);
      const seconds = times.playtime % 60;
      const playtime = `${hours}h ${minutes}m ${seconds}s`;
      const totalSeconds = times.playtime;
      return { user: player, playtime, totalSeconds, isOnline: times.isOnline };
    });

    return playtimeData;
  } catch (error: any) {
    console.error('Error reading log file:', error);
    throw error;
  }
}

function evaluateTime(joinTime: string | null, leaveTime: string | null, startTime = '00:00:00', endTime = '23:59:59') {
  if (!joinTime && !leaveTime) return 0;
  if (joinTime && joinTime > endTime) return 0;
  if (joinTime && joinTime < startTime) {
    joinTime = startTime;
  }
  if (leaveTime && leaveTime > endTime) {
    leaveTime = endTime;
  }
  if (!joinTime) {
    joinTime = startTime;
  } else if (!leaveTime) {
    leaveTime = endTime;
  }

  const parseTime = (timeStr: string) => {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return (hours * 3600 + minutes * 60 + seconds);
  };
  const joinTimeMs = parseTime(joinTime);
  const leaveTimeMs = parseTime(leaveTime!);

  const playtimeMs = leaveTimeMs - joinTimeMs;
  return playtimeMs > 0 ? Math.floor(playtimeMs) : 0;
};
