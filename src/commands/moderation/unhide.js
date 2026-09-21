const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { logAction } = require('../../utils/logger');

module.exports = {
  moderationCommand: true,
  data: new SlashCommandBuilder()
    .setName('unhide')
    .setDescription('Unhide a channel for @everyone')
    .addChannelOption((opt) => opt.setName('channel').setDescription('Channel to unhide (defaults to here)').addChannelTypes(ChannelType.GuildText).setRequired(false)),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: null });
    await interaction.reply(`👁️ ${channel} is visible again.`);
    await logAction(interaction.guild, {
      type: 'mod',
      title: 'Channel Unhidden',
      fields: [
        { name: 'Channel', value: `${channel}` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
      ],
    });
  },
};
