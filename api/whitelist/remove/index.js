const rcon = require('../../../rcon');

module.exports = {
  get(req, res) {
    // Return html for a simple whitelist remove form
    const username = req.query.username || '';
    res.send(`
      <form method="POST" action="/api/whitelist/remove/">
        ${req.query.success ? '<p>Player removed from whitelist successfully!</p><br>' : ''}
        <input type="text" name="username" placeholder="Username" value="${username}" required><br>
        <input type="hidden" name="redirect" value="1">
        <button type="submit">Remove from Whitelist</button>
      </form>
    `);
  },
  post(req, res) {
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

    rcon.send(`whitelist remove ${username}`);

    const doRedirect = req.body.redirect === '1';
    if (doRedirect) {
      // Redirect back to the form with a success message
      res.redirect(`/api/whitelist/remove/?username=${encodeURIComponent(username)}&success=1`);
    } else {
      // Respond with a success message
      res.send({ success: true, message: 'Player removed from whitelist successfully' });
    }
  }
}
