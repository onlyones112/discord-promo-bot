const { SlashCommandBuilder, PermissionFlagsBits, REST, Routes } = require('discord.js');
const path = require('path');
const { loadCommands, clearCache } = require('../utils/commandLoader');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reload all command files and re-sync slash commands with Discord (no restart needed)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const commandsDir = path.join(__dirname, '..', 'commands');
      clearCache(commandsDir);
      interaction.client.commands.clear();
      loadCommands(interaction.client, commandsDir);

      const commandData = [...interaction.client.commands.values()].map((c) => c.data.toJSON());
      const rest = new REST().setToken(process.env.DISCORD_TOKEN);

      if (process.env.GUILD_ID) {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commandData });
      } else {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandData });
      }

      await interaction.editReply(`✅ Reloaded **${interaction.client.commands.size}** commands from disk and synced them with Discord. New/changed commands are live now — no restart needed.`);
    } catch (err) {
      console.error('Reload failed:', err);
      await interaction.editReply('❌ Reload failed — check the console/logs for the error (likely a syntax error in a new command file).');
    }
  },
};
