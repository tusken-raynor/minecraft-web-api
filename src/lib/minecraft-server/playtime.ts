import fs from 'fs';
import { env } from '$env/dynamic/private';
import utils from '$lib/utils';
import db, { type MySQLPlaySessionsRecord, type MySQLSelectResult } from '$lib/db';
import type { MinecraftPlaySession, MinecraftUserSessionsInfo } from './types';

type PlayerData = {
  joinTime: string | null;
  leaveTime: string | null;
  playtime: number; // in seconds
  isOnline: boolean;
};

export default async (startQuery?: string | number, endQuery?: string | number) => {
  if (typeof startQuery === 'number') {
    startQuery = secondsToHMS(startQuery);
  }
  if (typeof endQuery === 'number') {
    endQuery = secondsToHMS(endQuery);
  }
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
      const playtime = utils.secondsToHMS(times.playtime);
      const totalSeconds = times.playtime;
      return { user: player, playtime, totalSeconds, isOnline: times.isOnline };
    });

    return playtimeData;
  } catch (error: any) {
    console.error('Error reading log file:', error);
    throw error;
  }
}

export async function playtime2(startQuery?: string | number, endQuery?: string | number) {
  try {
    if (typeof startQuery === 'string') {
      startQuery = Number(startQuery);
      startQuery = isNaN(startQuery) ? undefined : startQuery;
    }
    if (typeof endQuery === 'string') {
      endQuery = Number(endQuery);
      endQuery = isNaN(endQuery) ? undefined : endQuery;
    }
    let now = Math.floor(Date.now() / 1000);
    startQuery = startQuery === undefined ? now - 86400 : startQuery;
    endQuery = endQuery == undefined ? now : endQuery;

    const sessions = await sessionFromWindow(startQuery, endQuery);
    
    now = Math.floor(Date.now() / 1000);
    const sessionAccumulator: Record<string, number> = {};
    const onlinePlayers = new Set<string>();
    for (const session of sessions) {
      const sessionStart = session.start_time < startQuery ? startQuery : session.start_time;
      const sessionEnd = (session.end_time === null ? now : session.end_time) > endQuery ? endQuery : (session.end_time === null ? now : session.end_time);
      const playtime = sessionEnd - sessionStart;
      if (playtime > 0) {
        if (!sessionAccumulator[session.username]) {
          sessionAccumulator[session.username] = 0;
        }
        sessionAccumulator[session.username] += playtime;
      }
      if (session.end_time === null) {
        onlinePlayers.add(session.username);
      }
    }

    const playtimeData = Object.entries(sessionAccumulator).map(([user, totalSeconds]) => {
      return { user, totalSeconds, playtime: utils.secondsToHMS(totalSeconds), isOnline: onlinePlayers.has(user) };
    });

    return playtimeData;
  } catch (error) {
    console.error('Error in playtime2:', error);
  }
  return [];
}

export async function getPlaytimeSessions(startQuery?: number, endQuery?: number) {
  const now = Math.floor(Date.now() / 1000);
  if (startQuery === undefined) {
    startQuery = now - 86400; // default to last 24 hours
  }
  if (endQuery === undefined) {
    endQuery = now; // default to now
  }

  const sessions = await sessionFromWindow(startQuery, endQuery);
  
  const userRecords: Record<string, MinecraftUserSessionsInfo> = {};
  for (const session of sessions) {
    const sessionInfo: MinecraftPlaySession = { 
      id: session.id, 
      startTime: session.start_time, 
      endTime: (session.end_time === null ? now : session.end_time),
      active: !!session.active 
    };
    if (!userRecords[session.username]) {
      userRecords[session.username] = { user: session.username, sessions: [], totalSeconds: 0, isOnline: false };
    }
    userRecords[session.username].sessions.push(sessionInfo);
    userRecords[session.username].totalSeconds += (sessionInfo.endTime - sessionInfo.startTime);
    userRecords[session.username].isOnline = userRecords[session.username].isOnline || (sessionInfo.active);
  }

  return Object.values(userRecords);
}

async function sessionFromWindow(startTime: number, endTime: number) {
  const statement = `SELECT * FROM play_sessions WHERE (start_time >= ? AND start_time < ?) OR (end_time >= ? AND end_time < ?) OR (start_time < ? AND (end_time IS NULL OR end_time >= ?))`;
  const sessions = await db.query<MySQLSelectResult<MySQLPlaySessionsRecord>>(statement, [startTime, endTime, startTime, endTime, startTime, endTime]);
  return sessions;
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

function secondsToHMS(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}