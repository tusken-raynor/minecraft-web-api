const rconClient = require("../../rcon");

module.exports = {
  async get(req, res) {
    if (!rconClient.connected()) {
      return res.status(503).send({ success: false, message: 'RCON not connected' });
    }
    const rcon = rconClient.get();
    const response = await rcon.send('whitelist list');
    const messageParts = response.match(/(\d+) whitelisted player\(s\): (.+)/);
    const whitelistedCount = messageParts ? parseInt(messageParts[1], 10) : 0;
    const whitelistedPlayers = messageParts ? messageParts[2].split(', ') : [];
    res.send({ success: true, data: { whitelistedCount, whitelistedPlayers } });
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