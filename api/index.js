const msg = require("./msg");
const players = require("./players");
const playtime = require("./players/playtime");
const say = require("./say");
const whitelist = require("./whitelist");
const whitelistAdd = require("./whitelist/add");
const whitelistRemove = require("./whitelist/remove");
const worldTime = require("./world-time");

module.exports = {
  msg: msg,
  say: say,
  players: players,
  'players/playtime': playtime,
  'world-time': worldTime,
  whitelist: whitelist,
  'whitelist/add': whitelistAdd,
  'whitelist/remove': whitelistRemove,
}