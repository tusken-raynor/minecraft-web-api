const rcon = require('../../../rcon');

module.exports = {
  get(req, res) {
    // Return html for a simple whitelist add form
    const username = req.query.username || '';
    res.send(`
      <form method="POST" action="/api/whitelist/add/">
        ${req.query.success ? '<p>Player whitelisted successfully!</p><br>' : ''}
        <input type="text" name="username" placeholder="Username" value="${username}" required><br>
        <input type="hidden" name="redirect" value="1">
        <button type="submit">Add to Whitelist</button>
      </form>
    `);
  },
  post(req, res) {
    if (!rcon.connected()) {
      return res.status(503).send({ success: false, message: 'RCON not connected' });
    }

    // Handle whitelist add submission
    let username = req.body.username;
    if (!username) {
      return res.status(400).send({ success: false, message: 'Username is required' });
    }

    // Escape quotes and backslashes in the username
    username = username.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

    rcon.send(`whitelist add "${username}"`);

    const doRedirect = req.body.redirect === '1';
    if (doRedirect) {
      // Redirect back to the form with a success message
      res.redirect(`/api/whitelist/add/?username=${encodeURIComponent(username)}&success=1`);
    } else {
      // Respond with a success message
      res.send({ success: true, message: 'Player whitelisted successfully' });
    }
  }
}
