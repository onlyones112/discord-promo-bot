const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'social.json');

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

function getProfile(guildId, userId) {
  const data = load();
  return (data[guildId] && data[guildId][userId]) || { rep: 0, bio: null, lastRepGiven: 0 };
}

function addRep(guildId, userId) {
  const data = load();
  data[guildId] = data[guildId] || {};
  data[guildId][userId] = data[guildId][userId] || { rep: 0, bio: null, lastRepGiven: 0 };
  data[guildId][userId].rep += 1;
  save(data);
  return data[guildId][userId].rep;
}

function setLastRepGiven(guildId, userId, timestamp) {
  const data = load();
  data[guildId] = data[guildId] || {};
  data[guildId][userId] = data[guildId][userId] || { rep: 0, bio: null, lastRepGiven: 0 };
  data[guildId][userId].lastRepGiven = timestamp;
  save(data);
}

function setBio(guildId, userId, bio) {
  const data = load();
  data[guildId] = data[guildId] || {};
  data[guildId][userId] = data[guildId][userId] || { rep: 0, bio: null, lastRepGiven: 0 };
  data[guildId][userId].bio = bio;
  save(data);
}

module.exports = { getProfile, addRep, setLastRepGiven, setBio };
