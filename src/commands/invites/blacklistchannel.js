const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getConfig, setConfig } = require('../../utils/guildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklistchannel')
    .setDescription('Exclude a channel from invite-tracker announcements')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) => sub.setName('add').setDescription('Blacklist a channel').addChannelOption((opt) => opt.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand((sub) =>
      sub.setName('remove').setDescription('Un-blacklist a channel').addChannelOption((opt) => opt.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List blacklisted channels')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const current = getConfig(interaction.guild.id).blacklistedInviteChannels || [];

    if (sub === 'add') {
      const channel = interaction.options.getChannel('channel');
      setConfig(interaction.guild.id, { blacklistedInviteChannels: [...new Set([...current, channel.id])] });
      return interaction.reply(`${channel} is now blacklisted from invite-tracker announcements.`);
    }

    if (sub === 'remove') {
      const channel = interaction.options.getChannel('channel');
      setConfig(interaction.guild.id, { blacklistedInviteChannels: current.filter((id) => id !== channel.id) });
      return interaction.reply(`${channel} removed from the blacklist.`);
    }

    if (sub === 'list') {
      if (current.length === 0) return interaction.reply({ content: 'No channels blacklisted.', ephemeral: true });
      return interaction.reply({ content: current.map((id) => `<#${id}>`).join(', '), ephemeral: true });
    }
  },
};
