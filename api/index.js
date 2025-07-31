const msg = require("./msg");
const players = require("./players");
const playtime = require("./players/playtime");
const say = require("./say");
const worldTime = require("./world-time");

module.exports = {
  msg: msg,
  say: say,
  players: players,
  'players/playtime': playtime,
  'world-time': worldTime,
}