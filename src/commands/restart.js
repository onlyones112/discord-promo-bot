const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Restart the bot process')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.reply('🔄 Restarting... (back online in a few seconds)');
    // Exit with a non-zero code so hosts with a default "restart on crash" policy
    // (Railway, PM2, systemd, etc.) bring the process straight back up.
    setTimeout(() => process.exit(1), 1000);
  },
};
