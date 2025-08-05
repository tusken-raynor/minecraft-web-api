const rconClient = require("../../rcon");
const fs = require('fs');

const SERVER_PATH = process.env.SERVER_PATH;

module.exports = {
  async get(req, res) {
    // Return a list of the operators by looking at the whitelist.json file
    const filePath = `${SERVER_PATH}/whitelist.json`;
    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ success: false, message: 'No whitelist file found' });
    }
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const whitelisted = JSON.parse(data);
      res.send({ success: true, data: whitelisted });
    } catch (error) {
      res.status(500).send({ success: false, message: 'Failed to read whitelist: ' + error.message });
    }
  },
  async post(req, res) {
    if (!rconClient.connected()) {
      return res.status(503).send({ success: false, message: 'RCON not connected' });
    }

    // Handle whitelist add submission
    let username = req.body?.username;
    if (!username) {
      return res.status(400).send({ success: false, message: 'Username is required' });
    }

    // Escape quotes and backslashes in the username
    username = username.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

    try {
      const response = await rconClient.send(`whitelist add ${username}`);
      const success = !!response.match(/Added .+? to the whitelist/);
      res.send({ success, message: response });
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      res.status(500).send({ success: false, message: 'Failed to add player to whitelist' });
    }
  },
  async delete(req, res) {
    if (!rconClient.connected()) {
      return res.status(503).send({ success: false, message: 'RCON not connected' });
    }

    // Handle whitelist remove submission
    let username = req.body?.username;
    if (!username) {
      return res.status(400).send({ success: false, message: 'Username is required' });
    }

    // Escape quotes and backslashes in the username
    username = username.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

    try {
      const response = await rconClient.send(`whitelist remove ${username}`);
      const success = !!response.match(/Removed .+? from the whitelist/);
      res.send({ success, message: response });
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      res.status(500).send({ success: false, message: 'Failed to remove player from whitelist' });
    }
  }
}