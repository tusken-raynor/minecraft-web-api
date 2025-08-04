const rcon = require('../../../rcon');

module.exports = {
  get(req, res) {
    // Return html for a simple whitelist remove form
    const username = req.query.username || '';
    res.send(htmlForm('', username));
  },
  async post(req, res) {
    if (!rcon.connected()) {
      return res.status(503).send({ success: false, message: 'RCON not connected' });
    }

    // Handle whitelist remove submission
    let username = req.body.username;
    if (!username) {
      return res.status(400).send({ success: false, message: 'Username is required' });
    }

    // Escape quotes and backslashes in the username
    username = username.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

    const response = await rcon.send(`whitelist remove ${username}`);

    const doRedirect = req.body.redirect === '1';
    if (doRedirect) {
      // Reload the form with a success message
      res.send(htmlForm(response));
    } else {
      // Respond with a success message
      res.send({ success: true, message: 'Player removed from whitelist successfully' });
    }
  }
}


function htmlForm(message = '', username = '') {
  return `
    <form method="POST" action="/api/whitelist/remove/">
      ${message ? `<p>${message}</p><br>` : ''}
      <input type="text" name="username" placeholder="Username" value="${username}" required><br>
      <input type="hidden" name="redirect" value="1">
      <button type="submit">Remove from Whitelist</button>
    </form>
  `;
}