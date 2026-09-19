const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'giveaways.json');

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

function createGiveaway(giveaway) {
  const data = load();
  data[giveaway.messageId] = giveaway;
  save(data);
}

function getGiveaway(messageId) {
  const data = load();
  return data[messageId] || null;
}

function updateGiveaway(messageId, patch) {
  const data = load();
  if (!data[messageId]) return null;
  data[messageId] = { ...data[messageId], ...patch };
  save(data);
  return data[messageId];
}

function addParticipant(messageId, userId) {
  const data = load();
  const g = data[messageId];
  if (!g || g.ended) return null;
  if (!g.participants.includes(userId)) g.participants.push(userId);
  save(data);
  return g;
}

function endGiveaway(messageId) {
  const data = load();
  if (!data[messageId]) return null;
  data[messageId].ended = true;
  save(data);
  return data[messageId];
}

function getActiveDue(now) {
  const data = load();
  return Object.values(data).filter((g) => !g.ended && g.endTimestamp <= now);
}

function getAllActive() {
  const data = load();
  return Object.values(data).filter((g) => !g.ended);
}

module.exports = { createGiveaway, getGiveaway, updateGiveaway, addParticipant, endGiveaway, getActiveDue, getAllActive };
