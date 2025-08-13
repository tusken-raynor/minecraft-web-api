const { exec } = require("child_process");
const rconClient = require('../rcon');

// Target usernames combos
const TARGET_COMBOS = [
  ["1nkDrinker"],
  ["1nkDrinker", "ChubbyPolarBears"],
  ["1nkDrinker", "darkangels1245"],
  ["1nkDrinker", "ChubbyPolarBears", "darkangels1245"]
];

const THROTTLE_PERCENTAGE = 20; // CPU limit percentage

let throttled = false;

function arraysEqual(a, b) {
  return a.length === b.length && a.every(v => b.includes(v));
}

function getJavaPid(callback) {
  exec("ps aux | grep java", (err, stdout) => {
    if (err || !stdout) return callback(null);

    // Split output into lines and look for the one containing 'server.jar'
    const lines = stdout.split("\n");
    const serverLine = lines.find(line => line.includes("server.jar") && !line.includes("grep"));
    if (!serverLine) return callback(null);

    // The PID is the second column in ps aux output
    const parts = serverLine.trim().split(/\s+/);
    const pid = parts[1];
    callback(pid);
  });
}

function throttleJava(pid) {
  console.log(`Applying CPU limit to Java PID ${pid}`);
  exec(`cpulimit -p ${pid} -l ${THROTTLE_PERCENTAGE} --background`, err => {
    if (err) console.error("Failed to apply CPU limit:", err);
  });
}

function removeThrottle() {
  console.log("Removing CPU throttle");
  exec("pkill -f cpulimit", () => {});
}

async function checkPlayersAndThrottle() {
  if (!rconClient.connected()) {
    return;
  }
  
  const rcon = rconClient.get();
  const response = await rcon.send('list');
  const messageParts = response.match(/(\d+) of a max of (\d+) players online: (.+)/);
  const playersOnline = messageParts ? messageParts[3].split(', ') : [];

  const shouldThrottle = playersOnline.length > 0 && TARGET_COMBOS.some(combo => arraysEqual(combo, playersOnline));

  if (shouldThrottle && !throttled) {
    getJavaPid(pid => {
      if (pid) {
        throttleJava(pid);
        throttled = true;
      }
    });
  } else if (!shouldThrottle && throttled) {
    removeThrottle();
    throttled = false;
  }
}

module.exports = checkPlayersAndThrottle;
