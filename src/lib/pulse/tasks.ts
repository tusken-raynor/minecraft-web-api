import { env } from "$env/dynamic/private";
import utils from "$lib/utils";
import fs from "fs";
import db, { type MySQLSchedulesRecord, type MySQLSelectResult } from "$lib/db";
import { nextRun } from "$lib/cron";
import minecraftServer from "$lib/minecraft-server";

let lastLine = 0;
let utcTimestamp = utils.getUTCTimestamp();

const inProgressCommands = new Set<number>();
let commandRunTicker = 0;

export default {
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
  }
}

function parseLogLine(line: string) {
  // Example patterns, adjust as needed for your log format
  const playerMessage = /\[(\d+:\d+:\d+)\] \[.*\]: <(\w+)> (.+)/;
  const playerJoinLeave = /\[(\d+:\d+:\d+)\] \[.+\]: (\w+) (joined|left) the game/;
  const playerDeath = /\[(\d+:\d+:\d+)\] \[.+\]: (\w+) ((was|died|fell|blew up|tried|was slain|was shot|was killed|was burnt|was pricked|was squashed|was impaled|was pummeled|was stung|was poked|was blown up|was slain|was killed|was shot|was fireballed|was squashed|was impaled|was pummeled|was stung|was poked|was blown up|died).+)/;

  let timestamp = null;
  let output = '';

  if (playerMessage.test(line)) {
    const [, time, player, message] = line.match(playerMessage)!;
    timestamp = time;
    output = `Message from ${player}: ${message}`;
  } else if (playerJoinLeave.test(line)) {
    const [, time, player, action] = line.match(playerJoinLeave)!;
    timestamp = time;
    output = `${player} ${action} the game`;
  } else if (playerDeath.test(line)) {
    const [, time, player, desc] = line.match(playerDeath)!;
    timestamp = time;
    output = `${player} ${desc}`;
  }

  return [timestamp, output];
}