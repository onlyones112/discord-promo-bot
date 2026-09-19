const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'reactionRoles.json');

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

// key: messageId -> array of { emoji, roleId }
function addMapping(messageId, emoji, roleId) {
  const data = load();
  data[messageId] = data[messageId] || [];
  data[messageId] = data[messageId].filter((m) => m.emoji !== emoji);
  data[messageId].push({ emoji, roleId });
  save(data);
}

function removeMapping(messageId, emoji) {
  const data = load();
  if (!data[messageId]) return;
  data[messageId] = data[messageId].filter((m) => m.emoji !== emoji);
  save(data);
}

function getMappings(messageId) {
  const data = load();
  return data[messageId] || [];
}

module.exports = { addMapping, removeMapping, getMappings };
