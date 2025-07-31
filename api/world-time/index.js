const rconClient = require('../../rcon');

module.exports = {
  async get(req, res) {
    rcon
    if (!rconClient.connected()) {
      return res.status(503).send({ success: false, message: 'RCON not connected' });
    }
    const rcon = rconClient.get();
    try {
      const response = await rcon.send('time query daytime');
      const match = response.match(/\d+/);
      if (!match) return res.status(500).json({ success: false, message: 'Could not parse time' });

      const ticks = parseInt(match[0], 10);
      const clockTime = minecraftTicksToClock(ticks);
      res.json({ success: true, data: { ticks, time: clockTime } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to query Minecraft time' });
    }
  }
};

function minecraftTicksToClock(ticks) {
  // Minecraft day starts at 0, which we'll call 6 AM
  // So shift time by 6000 ticks to align 0 = midnight
  const shiftedTicks = (ticks + 6000) % 24000;
  const hours = Math.floor(shiftedTicks / 1000);
  const minutes = Math.floor((shiftedTicks % 1000) * 60 / 1000);
  
  let hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const amOrPm = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) {
    hh = String(hours - 12).padStart(2, '0');
  } else if (hours === 0) {
    hh = '12'; // Midnight case
  }

  return `${hh}:${mm} ${amOrPm}`;
}