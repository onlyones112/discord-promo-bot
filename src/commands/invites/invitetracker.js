const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getConfig, setConfig } = require('../../utils/guildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invitetracker')
    .setDescription('Set the channel where join-by-invite announcements get posted')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName('set').setDescription('Set the announcement channel').addChannelOption((opt) => opt.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('disable').setDescription('Turn off invite-join announcements'))
    .addSubcommand((sub) => sub.setName('view').setDescription('Show the current tracker channel')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel');
      setConfig(interaction.guild.id, { inviteTrackerChannelId: channel.id });
      return interaction.reply(`Invite-join announcements will now post in ${channel}.`);
    }

    if (sub === 'disable') {
      setConfig(interaction.guild.id, { inviteTrackerChannelId: null });
      return interaction.reply('Invite-join announcements disabled.');
    }

    if (sub === 'view') {
      const { inviteTrackerChannelId } = getConfig(interaction.guild.id);
      return interaction.reply({ content: inviteTrackerChannelId ? `Current channel: <#${inviteTrackerChannelId}>` : 'Not set.', ephemeral: true });
    }
  },
};
