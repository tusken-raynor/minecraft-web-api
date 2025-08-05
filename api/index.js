const fs = require('fs');
const msg = require("./msg");
const players = require("./players");
const playtime = require("./players/playtime");
const say = require("./say");
const whitelist = require("./whitelist");
const whitelistAdd = require("./whitelist/add");
const whitelistRemove = require("./whitelist/remove");
const worldTime = require("./world-time");

module.exports = {
  list: {
    msg: msg,
    say: say,
    players: players,
    'players/playtime': playtime,
    'world-time': worldTime,
    whitelist: whitelist,
    'whitelist/add': whitelistAdd,
    'whitelist/remove': whitelistRemove,
  },
  getEndPoints: function() {
    // Get the paths to all the index.js files recursively nested in the ./api using fs
    const apiDir = `${__dirname}`;

    const apiEndpointPaths = getAPIEndpointPaths(apiDir);

    const endpoints = {};
    apiEndpointPaths.forEach(path => {
      const endpointName = path.replace(apiDir + '/', '/api/').replace('/index.js', '');
      const endpointModule = require(path);
      endpoints[endpointName] = endpointModule;
    });

    return endpoints;
  }
}

function getAPIEndpointPaths(dir) {
  const paths = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = `${dir}/${file}`;
    if (fs.statSync(fullPath).isDirectory()) {
      paths.push(...getAPIEndpointPaths(fullPath)); // Recursively get paths from subdirectories
    }
    else if (file === 'index.js') {
      paths.push(fullPath); // Add the index.js file path
    }
  }
    
  return paths;
}