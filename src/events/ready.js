const { getActiveDue } = require('../utils/giveawayStore');
const { finishGiveaway } = require('../commands/giveaway');
const { cacheGuildInvites } = require('../utils/inviteCache');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: '/help' }], status: 'online' });

    // Prime the invite cache for every guild so we can detect which invite a new member used.
    for (const guild of client.guilds.cache.values()) {
      await cacheGuildInvites(guild);
    }

    // Check every 30s for giveaways whose timer has run out and end them.
    setInterval(async () => {
      const due = getActiveDue(Date.now());
      for (const giveaway of due) {
        await finishGiveaway(client, giveaway.messageId);
      }
    }, 30000);
  },
};
