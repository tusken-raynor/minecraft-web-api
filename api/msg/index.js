const rcon = require('../../rcon');
const utils = require('../../utils');

module.exports = {
  get(req, res) {
    // Return html for a simple message submission form
    const username = req.query.username || '';
    res.send(`
      <form method="POST" action="/api/msg/">
        ${req.query.success ? '<p>Message sent successfully!</p><br>' : ''}
        <input type="text" name="username" placeholder="Username" value="${username}" required><br>
        <textarea name="message" placeholder="Enter your message" rows="2" required></textarea><br>
        <input type="hidden" name="redirect" value="1">
        <button type="submit">Send</button>
      </form>
    `);
  },
  post(req, res) {
    if (!rcon.connected()) {
      return res.status(503).send({ success: false, message: 'RCON not connected' });
    }

    // Handle message submission
    let message = req.body.message;
    if (!message) {
      return res.status(400).send({ success: false, message: 'Message is required' });
    }
    let username = req.body.username || 'Anonymous';

    // Escape quotes and backslashes in the message
    message = message.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
    // Escape quotes in the username
    username = username.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

    rcon.send(`tellraw @a {"text":"<${username}> ${message}","color":"white"}`);
    // Append the message to the minecraft server logs to ensure it is visible in the console
    utils.append2ServerLogs(`<${username}> ${message}`);

    const doRedirect = req.body.redirect === '1';
    if (doRedirect) {
      // Redirect back to the form with a success message
      res.redirect(`/api/msg/?username=${encodeURIComponent(username)}&success=1`);
    } else {
      // Respond with a success message
      res.send({ success: true, message: 'Message sent successfully' });
    }
  }
}