const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { logAction } = require('../../utils/logger');

module.exports = {
  moderationCommand: true,
  data: new SlashCommandBuilder()
    .setName('hide')
    .setDescription('Hide a channel from @everyone')
    .addChannelOption((opt) => opt.setName('channel').setDescription('Channel to hide (defaults to here)').addChannelTypes(ChannelType.GuildText).setRequired(false)),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
    await interaction.reply(`👁️‍🗨️ ${channel} is now hidden from @everyone.`);
    await logAction(interaction.guild, {
      type: 'mod',
      title: 'Channel Hidden',
      fields: [
        { name: 'Channel', value: `${channel}` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
      ],
    });
  },
};
