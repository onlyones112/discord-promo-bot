const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig, getConfig } = require('../utils/guildConfig');

const TYPE_CHOICES = [
  { name: 'General (embeds, DM promo, giveaways)', value: 'general' },
  { name: 'Moderation (kick/ban/warn/purge/role/lock)', value: 'mod' },
  { name: 'Join/Leave', value: 'joinleave' },
  { name: 'Roles (given/taken)', value: 'roles' },
  { name: 'Voice (VC join/leave)', value: 'voice' },
  { name: 'Tickets', value: 'tickets' },
  { name: 'Antinuke', value: 'antinuke' },
];

const CHANNEL_NAMES = {
  general: 'general-logs',
  mod: 'mod-logs',
  joinleave: 'join-leave-logs',
  roles: 'role-logs',
  voice: 'voice-logs',
  tickets: 'ticket-logs',
  antinuke: 'antinuke-logs',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogs')
    .setDescription('Set up separate log channels for different kinds of events')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) => sub.setName('auto').setDescription('Automatically create a private log category with a separate channel per log type'))
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Point one log type at an existing channel')
        .addStringOption((opt) => opt.setName('type').setDescription('Which log type').setRequired(true).addChoices(...TYPE_CHOICES))
        .addChannelOption((opt) => opt.setName('channel').setDescription('Channel to send this type of log to').addChannelTypes(ChannelType.GuildText).setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('view').setDescription('Show all configured log channels'))
    .addSubcommand((sub) =>
      sub
        .setName('disable')
        .setDescription('Turn off logging for one type, or all of them')
        .addStringOption((opt) => opt.setName('type').setDescription('Leave empty to disable everything').setRequired(false).addChoices(...TYPE_CHOICES)),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const current = getConfig(interaction.guild.id).logs || {};

    if (sub === 'auto') {
      await interaction.deferReply({ ephemeral: true });
      const guild = interaction.guild;

      let category = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === '📁 Bot Logs');
      if (!category) {
        category = await guild.channels.create({
          name: '📁 Bot Logs',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }],
        });
      }

      const logs = { ...current };
      for (const { value } of TYPE_CHOICES) {
        if (logs[value]) continue; // already set, don't duplicate channels
        const channel = await guild.channels.create({
          name: CHANNEL_NAMES[value],
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }],
        });
        logs[value] = channel.id;
      }

      setConfig(guild.id, { logs });
      return interaction.editReply(`Created a full set of log channels under **${category.name}** (hidden from everyone except admins) — general, mod, join/leave, roles, voice, tickets, and antinuke each have their own channel now.`);
    }

    if (sub === 'set') {
      const type = interaction.options.getString('type');
      const channel = interaction.options.getChannel('channel');
      const logs = { ...current, [type]: channel.id };
      setConfig(interaction.guild.id, { logs });
      return interaction.reply(`**${type}** logs will now go to ${channel}.`);
    }

    if (sub === 'view') {
      if (Object.keys(current).length === 0) {
        return interaction.reply({ content: 'No log channels set yet. Use `/setlogs auto` to create a full set automatically.', ephemeral: true });
      }
      const lines = TYPE_CHOICES.map(({ name, value }) => `${current[value] ? `<#${current[value]}>` : '❌ not set'} — ${name}`);
      return interaction.reply({ content: lines.join('\n'), ephemeral: true });
    }

    if (sub === 'disable') {
      const type = interaction.options.getString('type');
      if (type) {
        const logs = { ...current };
        delete logs[type];
        setConfig(interaction.guild.id, { logs });
        return interaction.reply(`**${type}** logging disabled.`);
      }
      setConfig(interaction.guild.id, { logs: {} });
      return interaction.reply('All logging disabled.');
    }
  },
};
