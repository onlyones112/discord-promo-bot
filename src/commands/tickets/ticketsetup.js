const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { panelEmbed, panelRow } = require('../ticket-config-panel');

module.exports = {
  data: new SlashCommandBuilder().setName('ticketsetup').setDescription('Open the ticket configuration panel').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.reply({ embeds: [panelEmbed(interaction.guild.id, interaction.user.username)], components: [panelRow()] });
  },
};
