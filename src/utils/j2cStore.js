const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'j2c.json');

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

function guildData(guildId) {
  const data = load();
  if (!data[guildId]) data[guildId] = { hubs: [], activeChannels: {} };
  return data[guildId];
}

function addHub(guildId, hub) {
  const data = load();
  if (!data[guildId]) data[guildId] = { hubs: [], activeChannels: {} };
  data[guildId].hubs.push(hub);
  save(data);
}

function removeHub(guildId, hubChannelId) {
  const data = load();
  if (!data[guildId]) return;
  data[guildId].hubs = data[guildId].hubs.filter((h) => h.hubChannelId !== hubChannelId);
  save(data);
}

function getHubs(guildId) {
  return guildData(guildId).hubs;
}

function findHub(guildId, channelId) {
  return guildData(guildId).hubs.find((h) => h.hubChannelId === channelId) || null;
}

function registerActiveChannel(guildId, channelId, ownerId) {
  const data = load();
  if (!data[guildId]) data[guildId] = { hubs: [], activeChannels: {} };
  data[guildId].activeChannels[channelId] = ownerId;
  save(data);
}

function isActiveChannel(guildId, channelId) {
  return !!guildData(guildId).activeChannels[channelId];
}

function removeActiveChannel(guildId, channelId) {
  const data = load();
  if (!data[guildId]) return;
  delete data[guildId].activeChannels[channelId];
  save(data);
}

module.exports = { addHub, removeHub, getHubs, findHub, registerActiveChannel, isActiveChannel, removeActiveChannel };
