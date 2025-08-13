const fs = require('fs');
const utils = require('../utils');
const wtjptm = require('./wtjptm');

let lastLine = 0;
let logFile = process.env.SERVER_PATH + '/logs/latest.log';

function parseLogLine(line) {
  // Example patterns, adjust as needed for your log format
  const playerMessage = /\[(\d+:\d+:\d+)\] \[.*\]: <(\w+)> (.+)/;
  const playerJoinLeave = /\[(\d+:\d+:\d+)\] \[.+\]: (\w+) (joined|left) the game/;
  const playerDeath = /\[(\d+:\d+:\d+)\] \[.+\]: (\w+) ((was|died|fell|blew up|tried|was slain|was shot|was killed|was burnt|was pricked|was squashed|was impaled|was pummeled|was stung|was poked|was blown up|was slain|was killed|was shot|was fireballed|was squashed|was impaled|was pummeled|was stung|was poked|was blown up|died).+)/;

  let timestamp = null;
  let output = '';

  if (playerMessage.test(line)) {
    const [, time, player, message] = line.match(playerMessage);
    timestamp = time;
    output = `Message from ${player}: ${message}`;
  } else if (playerJoinLeave.test(line)) {
    const [, time, player, action] = line.match(playerJoinLeave);
    timestamp = time;
    output = `${player} ${action} the game`;
  } else if (playerDeath.test(line)) {
    const [, time, player, desc] = line.match(playerDeath);
    timestamp = time;
    output = `${player} ${desc}`;
  }

  return [timestamp, output];
}

function watchLog(intervalSeconds = 10, aliveCallback = null) {
  let utcTimestamp = utils.getUTCTimestamp();
  setInterval(() => {
    fs.readFile(logFile, 'utf8', (err, data) => {
      if (err) return;
      if (aliveCallback instanceof Function) {
        aliveCallback();
      }
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
    wtjptm();
  }, intervalSeconds * 1000);
}

module.exports = watchLog;