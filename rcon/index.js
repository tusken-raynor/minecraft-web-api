
const { Rcon } = require('rcon-client');

let rcon;
let connected = false;

async function initializeRcon(req, res, next) {
  if (rcon && connected) {
    return next(); // If RCON is already connected, just call next
  }
  rcon = new Rcon(this.options);
  try {
    await rcon.connect();
    console.log('RCON connection established');
    connected = true;
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
  return rcon && connected;
}

module.exports = { 
  initialize: initializeRcon, 
  get: getRcon, 
  connected: isConnected,
  /**
   * 
   * @param {string} command 
   * @returns 
   */
  send: (command) => {
    if (!rcon || !connected) {
      throw new Error('RCON not connected');
    }
    return rcon.send(command);
  }
};