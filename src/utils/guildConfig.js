const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'guildConfig.json');

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

function getConfig(guildId) {
  const data = load();
  return data[guildId] || {};
}

function setConfig(guildId, patch) {
  const data = load();
  data[guildId] = { ...(data[guildId] || {}), ...patch };
  save(data);
  return data[guildId];
}

module.exports = { getConfig, setConfig };
