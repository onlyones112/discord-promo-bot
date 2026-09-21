const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'invites.json');

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

function getStats(guildId, userId) {
  const data = load();
  return (data[guildId] && data[guildId][userId]) || { regular: 0, left: 0, fake: 0, bonus: 0 };
}

function adjustStats(guildId, userId, patch) {
  const data = load();
  data[guildId] = data[guildId] || {};
  data[guildId][userId] = data[guildId][userId] || { regular: 0, left: 0, fake: 0, bonus: 0 };
  for (const [key, delta] of Object.entries(patch)) {
    data[guildId][userId][key] = (data[guildId][userId][key] || 0) + delta;
  }
  save(data);
  return data[guildId][userId];
}

function setJoinInfo(guildId, userId, info) {
  const data = load();
  data[guildId] = data[guildId] || {};
  data.__joins = data.__joins || {};
  data.__joins[guildId] = data.__joins[guildId] || {};
  data.__joins[guildId][userId] = info; // { inviterId, code, joinedAt }
  save(data);
}

function getJoinInfo(guildId, userId) {
  const data = load();
  return data.__joins?.[guildId]?.[userId] || null;
}

function getLeaderboard(guildId, limit = 10) {
  const data = load();
  const guildData = data[guildId] || {};
  return Object.entries(guildData)
    .map(([userId, s]) => ({ userId, total: s.regular + s.bonus - s.left }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function resetGuild(guildId) {
  const data = load();
  delete data[guildId];
  if (data.__joins) delete data.__joins[guildId];
  save(data);
}

function resetUser(guildId, userId) {
  const data = load();
  if (data[guildId]) delete data[guildId][userId];
  save(data);
}

module.exports = { getStats, adjustStats, setJoinInfo, getJoinInfo, getLeaderboard, resetGuild, resetUser };
