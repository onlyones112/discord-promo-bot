const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { resetGuild } = require('../../utils/inviteStore');

module.exports = {
  data: new SlashCommandBuilder().setName('invitereset').setDescription('Wipe ALL invite stats for this server').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    resetGuild(interaction.guild.id);
    await interaction.reply('🗑️ All invite stats for this server have been reset.');
  },
};
