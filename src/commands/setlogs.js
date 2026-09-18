const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig, getConfig } = require('../utils/guildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogs')
    .setDescription('Set up the channel where bot actions get logged')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) => sub.setName('auto').setDescription('Automatically create a private "Bot Logs" category + channel for you'))
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Use an existing channel for logs instead')
        .addChannelOption((opt) => opt.setName('channel').setDescription('Channel to send logs to').addChannelTypes(ChannelType.GuildText).setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('view').setDescription('Show the current log channel'))
    .addSubcommand((sub) => sub.setName('disable').setDescription('Turn off logging')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

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

      const channel = await guild.channels.create({
        name: 'bot-logs',
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }],
      });

      setConfig(guild.id, { logChannelId: channel.id });
      return interaction.editReply(`Created ${channel} under **${category.name}** (hidden from everyone except admins) and set it as the log channel.`);
    }

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel');
      setConfig(interaction.guild.id, { logChannelId: channel.id });
      return interaction.reply(`Logging enabled. All bot actions (moderation, tickets, DM promo, embeds) will be logged in ${channel}.`);
    }

    if (sub === 'view') {
      const { logChannelId } = getConfig(interaction.guild.id);
      if (!logChannelId) return interaction.reply({ content: 'No log channel set yet. Use `/setlogs auto` or `/setlogs set`.', ephemeral: true });
      return interaction.reply({ content: `Current log channel: <#${logChannelId}>`, ephemeral: true });
    }

    if (sub === 'disable') {
      setConfig(interaction.guild.id, { logChannelId: null });
      return interaction.reply('Logging disabled.');
    }
  },
};
