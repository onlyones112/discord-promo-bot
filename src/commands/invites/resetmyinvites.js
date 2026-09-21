const { SlashCommandBuilder } = require('discord.js');
const { getStats, adjustStats } = require('../../utils/inviteStore');

module.exports = {
  data: new SlashCommandBuilder().setName('resetmyinvites').setDescription('Clear any manual bonus/removal adjustments on your own invite count'),

  async execute(interaction) {
    const stats = getStats(interaction.guild.id, interaction.user.id);
    adjustStats(interaction.guild.id, interaction.user.id, { bonus: -stats.bonus });
    await interaction.reply({ content: "Your bonus adjustments have been cleared. This doesn't affect your real tracked invites (regular/left/fake).", ephemeral: true });
  },
};
