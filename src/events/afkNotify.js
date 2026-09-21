const { getAfk, clearAfk } = require('../utils/afkStore');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    // Clear AFK when the AFK user speaks again.
    const own = getAfk(message.guild.id, message.author.id);
    if (own) {
      clearAfk(message.guild.id, message.author.id);
      message.reply(`👋 Welcome back ${message.author}, I removed your AFK.`).then((m) => setTimeout(() => m.delete().catch(() => {}), 8000)).catch(() => {});
    }

    // Notify if any mentioned user is AFK.
    for (const user of message.mentions.users.values()) {
      const afk = getAfk(message.guild.id, user.id);
      if (afk) {
        const minutesAgo = Math.floor((Date.now() - afk.since) / 60000);
        message.reply(`💤 ${user.username} is AFK: ${afk.reason} (${minutesAgo}m ago)`).catch(() => {});
      }
    }
  },
};
