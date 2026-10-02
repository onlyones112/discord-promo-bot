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

// Only these are safe to trigger with zero prefix by anyone on the /guildnoprefix
// list — read-only, can't be accidentally destructive if someone just types the word.
const NO_PREFIX_SAFE_LIST = ['help', 'ping'];

// Typing one of these bare words opens the matching config panel — still gated
// by the same permission the equivalent slash command requires, AND the
// person must be on the /guildnoprefix list (except guildnoprefix itself,
// which has to be reachable without being on that list already).
const BARE_PANEL_TRIGGERS = {
  antinuke: {
    permission: PermissionFlagsBits.Administrator,
    run: async (message) => {
      const { getAntinuke } = require('../commands/antinuke');
      const { panelEmbed, panelRows } = require('../commands/antinuke-panel');
      const settings = getAntinuke(message.guild.id);
      await message.reply({ embeds: [panelEmbed(settings, message.author.username)], components: panelRows() });
    },
  },
  automod: {
    permission: PermissionFlagsBits.ManageGuild,
    run: async (message) => {
      const { getAutomod } = require('../commands/automod');
      const { panelEmbed, panelRow } = require('../commands/automod-panel');
      const settings = getAutomod(message.guild.id);
      await message.reply({ embeds: [panelEmbed(settings)], components: [panelRow(settings)] });
    },
  },
  moderation: {
    permission: PermissionFlagsBits.ManageMessages,
    run: async (message) => {
      const { panelEmbed, panelRows } = require('../commands/moderation-panel');
      await message.reply({ embeds: [panelEmbed(message.guild, message.author.username)], components: panelRows() });
    },
  },
  rolelock: {
    permission: PermissionFlagsBits.Administrator,
    run: async (message) => {
      const { getRoleLock } = require('../commands/rolelock');
      const { panelEmbed, panelRow } = require('../commands/rolelock-panel');
      const settings = getRoleLock(message.guild.id);
      await message.reply({ embeds: [panelEmbed(settings)], components: [panelRow()] });
    },
  },
  modperms: {
    permission: PermissionFlagsBits.Administrator,
    run: async (message) => {
      const { panelEmbed, panelRows } = require('../commands/modperms-panel');
      await message.reply({ embeds: [panelEmbed(message.guild.id, message.author.username)], components: panelRows() });
    },
  },
  autorole: {
    permission: PermissionFlagsBits.ManageRoles,
    run: async (message) => {
      const { panelEmbed, panelRow } = require('../commands/autorole-panel');
      await message.reply({ embeds: [panelEmbed(message.guild.id, message.author.username)], components: [panelRow()] });
    },
  },
  ticketsetup: {
    permission: PermissionFlagsBits.ManageGuild,
    run: async (message) => {
      const { panelEmbed, panelRow } = require('../commands/ticket-config-panel');
      await message.reply({ embeds: [panelEmbed(message.guild.id, message.author.username)], components: [panelRow()] });
    },
  },
};

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const bare = message.content.trim().toLowerCase();
    const { prefix, noPrefixUsers } = getConfig(message.guild.id);

    // "guildnoprefix" is always bare-triggerable for Manage Server holders —
    // it has to be, since it's the command that builds the no-prefix list itself.
    if (bare === 'guildnoprefix') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return;
      const { panelEmbed, panelRow } = require('../commands/guildnoprefix');
      await message.reply({ embeds: [panelEmbed(message.guild.id, message.author.username)], components: [panelRow()] });
      return;
    }

    // Everything else bare-typed requires being on the /guildnoprefix list.
    if (noPrefixUsers?.includes(message.author.id)) {
      if (NO_PREFIX_SAFE_LIST.includes(bare)) {
        try {
          await PREFIX_COMMANDS[bare](message, [], prefix);
        } catch (err) {
          console.error('No-prefix command failed:', err);
        }
        return;
      }

      const panelTrigger = BARE_PANEL_TRIGGERS[bare];
      if (panelTrigger) {
        if (!message.member.permissions.has(panelTrigger.permission)) {
          await message.reply({ content: "You don't have permission to open that panel." }).then((m) => setTimeout(() => m.delete().catch(() => {}), 6000));
          return;
        }
        try {
          await panelTrigger.run(message);
        } catch (err) {
          console.error('Bare panel trigger failed:', err);
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
