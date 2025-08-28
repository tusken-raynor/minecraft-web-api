import { env } from "$env/dynamic/private";
import utils from "$lib/utils";
import fs from "fs";
import db, { type MySQLPlaySessionsRecord, type MySQLSchedulesRecord, type MySQLSelectResult } from "$lib/db";
import { nextRun } from "$lib/cron";
import minecraftServer from "$lib/minecraft-server";
import { defineTasks, parseLogLine, shouldDisableChunkLoaders } from "./lib";

let lastLine = 0;
let utcTimestamp = utils.getUTCTimestamp();

const inProgressCommands = new Set<number>();
let commandRunTicker = 0;

let chunkManagerTicker = 0;

export default defineTasks({
  readServerLogs() {
    const logFile = env.SERVER_PATH + '/logs/latest.log';
    fs.readFile(logFile, 'utf8', (err, data) => {
      if (err) return;
      const lines = data.split('\n');
      // Reset the lastLine value if the file has been reset
      if (lines.length < lastLine) {
        lastLine = 0; // Reset if the log file has been truncated
      }
      const start = Math.max(lastLine - 5, 0); // Read the last 5 lines just in case
      for (let i = start; i < lines.length; i++) {
        if (lines[i].trim() !== '') {
          const [timestamp, msg] = parseLogLine(lines[i]);
          if (timestamp && timestamp > utcTimestamp) {
            utcTimestamp = timestamp; 
            console.log(`${msg}`);
          }
        }
      }
      lastLine = lines.length;
    });
  },
  async runScheduledCommands() {
    // Only run commands every 6 pulses, AKA every minute
    const shouldRun = commandRunTicker === 0;
    commandRunTicker += 1;
    if (commandRunTicker >= 6) {
      commandRunTicker = 0;
    }
    if (!shouldRun) return;
    // Implementation for running scheduled commands
    const now = Math.floor(Date.now() / 1000);
    const rslt = await db.query<MySQLSelectResult<MySQLSchedulesRecord>>("SELECT id, run_at, command, cron FROM schedules WHERE run_at <= ?", [now]);
    
    // Run the freakin command
    const updates: Array<{ id: number, nextRunTime: number }> = [];
    for (const schedule of rslt) {
      if (inProgressCommands.has(schedule.id)) {
        console.log(`Skipping schedule ID ${schedule.id} as it's already in progress.`);
        continue;
      }

      inProgressCommands.add(schedule.id);
      await minecraftServer.runCommand(schedule.command);
      inProgressCommands.delete(schedule.id);

      // Calculate the next time the scheduled command needs to run
      const nextRunTime = nextRun(schedule.cron, now + 1);
      updates.push({ id: schedule.id, nextRunTime });
    }

    if (updates.length) {
      const statement = `UPDATE schedules SET run_at = CASE id ${updates.map(update => `WHEN ${update.id} THEN ${update.nextRunTime}`).join(" ")} END WHERE id IN (${updates.map(update => update.id).join(", ")})`;
      await db.query(statement);
    }
  },
  async pollPlaySessions() {
    try {
      // Implementation for polling play sessions
      const players = new Set(this.listDetails.players);

      const sessions = await db.query<MySQLSelectResult<MySQLPlaySessionsRecord>>(`SELECT * FROM play_sessions WHERE active = TRUE`);

      // Loop through the sessions and end any whose players are no longer online
      const notActiveRecords: number[] = [];
      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        if (players.has(session.username)) {
          // Player is still online, just keep the session active and remove them from the list
          players.delete(session.username);
        } else {
          // Player is no longer online, end the session
          notActiveRecords.push(session.id);
        }
      }

      // Any remaining players on the list players list are online, but don't
      // have a session record, so we need to create one for them
      let insertPromise: Promise<any> = Promise.resolve();
      const now = Math.floor(Date.now() / 1000);
      if (players.size) {
        const newPlayers = Array.from(players);
        insertPromise = db.query(`INSERT INTO play_sessions (username, start_time) VALUES ${newPlayers.map(player => `('${player}', ${now})`).join(", ")}`);
      }

      // Run a statement that sets all inactive sessions to not active
      let updatePromise: Promise<any> = Promise.resolve();
      if (notActiveRecords.length) {
        updatePromise = db.query(`UPDATE play_sessions SET active = FALSE, end_time = ? WHERE id IN (${notActiveRecords.join(", ")})`, [now]);
      }

      await Promise.all([insertPromise, updatePromise]);
    } catch (error) {
      console.error("Error polling play sessions:", error);
    }
  },
  async manageChunkLoaders() {
    const shouldRun = chunkManagerTicker === 0; // Run every 12 cycles (aka 2 minute)
    chunkManagerTicker++;
    if (chunkManagerTicker >= 12) {
      chunkManagerTicker = 0;
    }
    if (!shouldRun) return;
    if (!shouldDisableChunkLoaders(this.listDetails.players)) return;

    // Kill any lingering chunk-loader pearls to reduce server-lag
    const response = await minecraftServer.runCommand('kill @e[type=ender_pearl]');
    if (response.raw.trim() !== 'No entity was found') {
      console.log("Chunk loaders managed:", response.raw);
    }
  }
})

