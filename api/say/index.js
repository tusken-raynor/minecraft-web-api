const rcon = require('../../rcon');

module.exports = {
  get(req, res) {
    res.send(`
      <form method="POST" action="/api/say/">
        ${req.query.success ? '<p>Message sent successfully!</p><br>' : ''}
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

    rcon.send(`say ${message}`);

    const doRedirect = req.body.redirect === '1';
    if (doRedirect) {
      // Redirect back to the form with a success message
      res.redirect(`/api/say/?success=1`);
    } else {
      // Respond with a success message
      res.send({ success: true, message: 'Message sent successfully' });
    }
  }
}