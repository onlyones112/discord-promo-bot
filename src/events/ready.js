const { getActiveDue } = require('../utils/giveawayStore');
const { finishGiveaway } = require('../commands/giveaway');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: '/help' }], status: 'online' });

    // Check every 30s for giveaways whose timer has run out and end them.
    setInterval(async () => {
      const due = getActiveDue(Date.now());
      for (const giveaway of due) {
        await finishGiveaway(client, giveaway.messageId);
      }
    }, 30000);
  },
};
