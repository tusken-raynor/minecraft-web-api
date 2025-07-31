const rconClient = require("../../rcon");

module.exports = {
  async get(req, res) {
    if (!rconClient.connected()) {
      return res.status(503).send({ success: false, message: 'RCON not connected' });
    }
    const rcon = rconClient.get();
    const response = await rcon.send('list');
    const messageParts = response.match(/(\d+) of a max of (\d+) players online: (.+)/);
    const playerCount = messageParts ? parseInt(messageParts[1], 10) : 0;
    const maxPlayers = messageParts ? parseInt(messageParts[2], 10) : 0;
    const players = messageParts ? messageParts[3].split(', ') : [];
    res.send({ success: true, data: { playerCount, maxPlayers, players } });
  }
}