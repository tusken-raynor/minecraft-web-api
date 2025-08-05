require('dotenv').config(); // ← Load .env variables first
const express = require('express');
const securityLayer = require('./security');
const rconClient = require('./rcon');
const rcon = require('./rcon');
const endpoints = require('./api');
const watch = require('./dispatcher');
const utils = require('./utils');
const fs = require('fs');

const app = express();
const PORT = 52341;

const RCON_OPTIONS = {
  host: '127.0.0.1',
  port: 25575,
  password: process.env.RCON_PASSWORD, // ← Now sourced from .env
};

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

// Serve the favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(`${__dirname}/favicon.ico`);
});

// Use the registered endpoints create listeners in the express app
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

// Get the paths to all the index.js files recursively nested in the ./api using fs
const apiDir = `${__dirname}/api`;
console.log(`Loading API endpoints from ${apiDir}`);
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
const apiPaths = getAPIEndpointPaths(apiDir);
console.log(`Found ${apiPaths.length} API endpoint files.`);
console.log(apiPaths);

// Setup the server event dispatcher module
let lastSuccessfulGameEventDispatch = utils.getUTCTimestamp();
watch(10, () => {
  lastSuccessfulGameEventDispatch = utils.getUTCTimestamp();
});

app.get('/api/process/status', (req, res) => {
  res.send({
    lastSuccessfulGameEventDispatch,
    rconConnected: rconClient.connected(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});