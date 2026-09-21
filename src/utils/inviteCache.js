// guildId -> Map(inviteCode -> { uses, inviterId })
const cache = new Map();

async function cacheGuildInvites(guild) {
  try {
    const invites = await guild.invites.fetch();
    const map = new Map();
    invites.forEach((inv) => map.set(inv.code, { uses: inv.uses || 0, inviterId: inv.inviter?.id || null }));
    cache.set(guild.id, map);
  } catch {
    // missing Manage Guild permission or other fetch failure — invite tracking just won't work for this guild
  }
}

function getCached(guildId) {
  return cache.get(guildId) || new Map();
}

function setCached(guildId, map) {
  cache.set(guildId, map);
}

module.exports = { cacheGuildInvites, getCached, setCached };
