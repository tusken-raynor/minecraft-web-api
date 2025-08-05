const rconClient = require("../../rcon");
const fs = require('fs');

const SERVER_PATH = process.env.SERVER_PATH;

module.exports = {
  POST: async function(req, res) {
    if (!rconClient.connected()) {
      return res.status(503).send({ success: false, message: 'RCON not connected' });
    }
    const username = req.body?.username;
    if (!username) {
      return res.status(400).send({ success: false, message: 'Username is required' });
    }

    try {
      const response = await rconClient.send(`op ${username}`);
      const success = !!response.match(/Made .+? a server operator/);
      res.send({ success, message: response });
    } catch (error) {
      res.status(500).send({ success: false, message: 'Failed to add operator: ' + error.message });
    }
  },
  DELETE: async function(req, res) {
    if (!rconClient.connected()) {
      return res.status(503).send({ success: false, message: 'RCON not connected' });
    }
    const username = req.body?.username;
    if (!username) {
      return res.status(400).send({ success: false, message: 'Username is required' });
    }

    try {
      const response = await rconClient.send(`deop ${username}`);
      const success = !!response.match(/Made .+? no longer a server operator/);
      res.send({ success, message: response });
    } catch (error) {
      res.status(500).send({ success: false, message: 'Failed to remove operator: ' + error.message });
    }
  },
  GET: function(req, res) {
    // Return a list of the operators by looking at the ops.json file
    const filePath = `${SERVER_PATH}/ops.json`;
    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ success: false, message: 'No operators found' });
    }
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const operators = JSON.parse(data);
      res.send({ success: true, data: operators });
    } catch (error) {
      res.status(500).send({ success: false, message: 'Failed to read operators: ' + error.message });
    }
  }
};