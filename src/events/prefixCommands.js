const { PermissionFlagsBits } = require('discord.js');
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
    await message.reply(`Current prefix: \`${prefix || '(none — slash-only mode)'}\` — change it with \`/setprefix set\`, or turn it off with \`/setprefix disable\`.`);
  },
};

// Only these are safe to trigger with zero prefix (via /guildnoprefix) —
// read-only, can't be accidentally destructive if someone just types the word in chat.
const NO_PREFIX_SAFE_LIST = ['help', 'ping'];

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    // Typing the bare word "guildnoprefix" (no slash, no prefix needed) opens
    // its panel directly — for anyone with Manage Server permission.
    if (message.content.trim().toLowerCase() === 'guildnoprefix') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return;
      const { panelEmbed, panelRow } = require('../commands/guildnoprefix');
      await message.reply({ embeds: [panelEmbed(message.guild.id, message.author.username)], components: [panelRow()] });
      return;
    }

    const { prefix, noPrefixUsers } = getConfig(message.guild.id);

    // No-prefix mode: only for specific users added via /guildnoprefix, and
    // only fires on an exact, bare match ("ping" / "help" with nothing else)
    // so normal conversation isn't affected.
    if (noPrefixUsers?.includes(message.author.id)) {
      const bare = message.content.trim().toLowerCase();
      if (NO_PREFIX_SAFE_LIST.includes(bare)) {
        try {
          await PREFIX_COMMANDS[bare](message, [], prefix);
        } catch (err) {
          console.error('No-prefix command failed:', err);
        }
        return;
      }
    }

    if (!prefix || !message.content.startsWith(prefix)) return;

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
