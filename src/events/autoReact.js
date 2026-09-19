const { getAutoReacts } = require('../commands/autoreact');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const reacts = getAutoReacts(message.guild.id);
    const matches = reacts.filter((r) => r.channelId === message.channel.id);
    for (const r of matches) {
      await message.react(r.emoji).catch(() => {});
    }
  },
};
