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
  }
}