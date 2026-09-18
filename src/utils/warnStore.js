const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'warnings.json');

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

function addWarning(guildId, userId, reason, moderatorId) {
  const data = load();
  data[guildId] = data[guildId] || {};
  data[guildId][userId] = data[guildId][userId] || [];
  data[guildId][userId].push({ reason, moderatorId, date: new Date().toISOString() });
  save(data);
  return data[guildId][userId].length;
}

function getWarnings(guildId, userId) {
  const data = load();
  return (data[guildId] && data[guildId][userId]) || [];
}

function clearWarnings(guildId, userId) {
  const data = load();
  if (data[guildId]) delete data[guildId][userId];
  save(data);
}

module.exports = { addWarning, getWarnings, clearWarnings };
