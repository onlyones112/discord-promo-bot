const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'afk.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function setAfk(guildId, userId, reason) {
  const data = load();
  data[guildId] = data[guildId] || {};
  data[guildId][userId] = { reason: reason || 'AFK', since: Date.now() };
  save(data);
}

function getAfk(guildId, userId) {
  const data = load();
  return data[guildId]?.[userId] || null;
}

function clearAfk(guildId, userId) {
  const data = load();
  if (data[guildId]) delete data[guildId][userId];
  save(data);
}

module.exports = { setAfk, getAfk, clearAfk };
