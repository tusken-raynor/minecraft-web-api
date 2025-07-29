const fs = require('fs');

let lastLine = 0;
let logFile = process.env.SERVER_PATH + '/logs/latest.log';

function parseLogLine(line) {
  // Example patterns, adjust as needed for your log format
  const playerMessage = /\[.*\]: <(\w+)> (.+)/;
  const playerJoin = /(\w+) joined the game/;
  const playerLeave = /(\w+) left the game/;
  const playerDeath = /(\w+) (was|died|fell|blew up|tried|was slain|was shot|was killed|was burnt|was pricked|was squashed|was impaled|was pummeled|was stung|was poked|was blown up|was slain|was killed|was shot|was fireballed|was squashed|was impaled|was pummeled|was stung|was poked|was blown up|died)/;

  if (playerMessage.test(line)) {
    const [, player, message] = line.match(playerMessage);
    console.log(`Message from ${player}: ${message}`);
  } else if (playerJoin.test(line)) {
    const [, player] = line.match(playerJoin);
    console.log(`${player} joined the game`);
  } else if (playerLeave.test(line)) {
    const [, player] = line.match(playerLeave);
    console.log(`${player} left the game`);
  } else if (playerDeath.test(line)) {
    console.log(line);
  }
}

function watchLog(intervalSeconds = 10) {
  setInterval(() => {
    fs.readFile(logFile, 'utf8', (err, data) => {
      if (err) return;
      const lines = data.split('\n');
      // Reset the lastLine value if the file has been reset
      if (lines.length < lastLine) {
        lastLine = 0; // Reset if the log file has been truncated
      }
      for (let i = lastLine; i < lines.length; i++) {
        if (lines[i].trim() !== '') {
          parseLogLine(lines[i]);
        }
      }
      lastLine = lines.length;
    });
  }, intervalSeconds * 1000);
}

module.exports = watchLog;