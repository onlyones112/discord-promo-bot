const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../../utils/logger');

module.exports = {
  moderationCommand: true,
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock or unlock this channel for @everyone')
    .addSubcommand((sub) => sub.setName('on').setDescription('Lock this channel'))
    .addSubcommand((sub) => sub.setName('off').setDescription('Unlock this channel')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const everyone = interaction.guild.roles.everyone;

    if (sub === 'on') {
      await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: false });
      await interaction.reply('🔒 Channel locked.');
    } else {
      await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: null });
      await interaction.reply('🔓 Channel unlocked.');
    }

    await logAction(interaction.guild, {
      type: 'mod',
      title: sub === 'on' ? 'Channel Locked' : 'Channel Unlocked',
      fields: [
        { name: 'Channel', value: `${interaction.channel}` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
      ],
    });
  },
};
