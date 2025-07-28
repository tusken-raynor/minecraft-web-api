
const { Rcon } = require('rcon-client');

let rcon;

async function initializeRcon(req, res, next) {
  if (rcon && rcon.connected) {
    next(); // If RCON is already connected, just call next
  }
  rcon = new Rcon(this.options);
  try {
    await rcon.connect();
    console.log('RCON connection established');
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Failed to connect to RCON:', error);
    res.status(500).send({ success: false, message: 'Failed to connect to RCON' });
  }
}

function getRcon() {
  return rcon;
}

function isConnected() {
  return rcon && rcon.connected;
}

module.exports = { 
  initialize: initializeRcon, 
  get: getRcon, 
  connected: isConnected 
};