const { getConfig } = require('../utils/guildConfig');
const { mainEmbed, selectRow } = require('../commands/help');

// Add more entries here to support more prefix commands later —
// each just needs a function that receives (message, args, prefix).
const PREFIX_COMMANDS = {
  help: async (message) => {
    await message.reply({ embeds: [mainEmbed(message.client)], components: [selectRow(null)] });
  },
  ping: async (message) => {
    const sent = await message.reply('Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`🏓 Pong! Latency: ${latency}ms | API: ${Math.round(message.client.ws.ping)}ms`);
  },
  prefix: async (message, args, prefix) => {
    await message.reply(`Current prefix: \`${prefix}\` — change it with \`/setprefix set\`, or turn it off with \`/setprefix disable\`.`);
  },
};

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const { prefix } = getConfig(message.guild.id);
    if (!prefix) return; // no prefix configured — slash-only mode

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const cmdName = args.shift()?.toLowerCase();
    if (!cmdName) return;

    const handler = PREFIX_COMMANDS[cmdName];
    if (!handler) return;

    try {
      await handler(message, args, prefix);
    } catch (err) {
      console.error('Prefix command failed:', err);
    }
  },
};
