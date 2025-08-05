require('dotenv').config(); // ← Load .env variables first
const express = require('express');
const securityLayer = require('./security');
const rconClient = require('./rcon');
const rcon = require('./rcon');
const api = require('./api');
const watch = require('./dispatcher');
const utils = require('./utils');

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

// Serve web page assets from the dashboard directory
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/dashboard/index.html`);
});
app.get('/main.css', (req, res) => {
  res.sendFile(`${__dirname}/dashboard/main.css`);
});
app.get('/main.js', (req, res) => {
  res.sendFile(`${__dirname}/dashboard/main.js`);
});

// Serve the favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(`${__dirname}/favicon.ico`);
});

// Use the registered endpoints create listeners in the express app
for (let [path, handler] of Object.entries(api.getEndPoints())) {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  if (!path.endsWith('/')) {
    path += '/';
  }
  for (const key in handler) {
    const method = key.toLowerCase();
    if (method in app) {
      const methodHandler = handler[key];
      app[method](path, methodHandler);
    }
  }
}
// Setup a fallback for undefined api routes
app.use('/api', (req, res) => {
  res.status(404).send({ success: false, message: 'API endpoint not found.' });
});


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