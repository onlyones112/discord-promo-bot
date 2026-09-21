const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../../utils/logger');

module.exports = {
  moderationCommand: true,
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for this channel')
    .addIntegerOption((opt) => opt.setName('seconds').setDescription('Seconds between messages (0 to disable, max 21600)').setMinValue(0).setMaxValue(21600).setRequired(true)),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds');
    await interaction.channel.setRateLimitPerUser(seconds);
    await interaction.reply(seconds === 0 ? 'Slowmode disabled.' : `Slowmode set to ${seconds}s.`);
    await logAction(interaction.guild, {
      type: 'mod',
      title: 'Slowmode Changed',
      fields: [
        { name: 'Channel', value: `${interaction.channel}` },
        { name: 'Seconds', value: `${seconds}` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
      ],
    });
  },
};
