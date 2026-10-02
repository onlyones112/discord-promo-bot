const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getAutoroles } = require('./autorole');
const { buildPanelEmbed } = require('../utils/panelStyle');

function panelEmbed(guildId, requestedBy) {
  const current = getAutoroles(guildId);
  return buildPanelEmbed({
    moduleKey: 'autorole',
    moduleLabel: 'Autorole',
    tagline: 'Roles auto-assigned the moment someone joins.',
    statusLines: [
      `human roles ..... ${current.humanRoleIds.length}`,
      `bot roles ....... ${current.botRoleIds.length}`,
    ],
    requestedBy,
  });
}

function panelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_autorole_human').setLabel('Human Role').setEmoji('🧑').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_autorole_bot').setLabel('Bot Role').setEmoji('🤖').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_autorole_close').setLabel('Dismiss').setEmoji('✕').setStyle(ButtonStyle.Secondary),
  );
}

module.exports = {
  panelEmbed,
  panelRow,

  data: new SlashCommandBuilder().setName('autorole-panel').setDescription('Open the Autorole dashboard').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    await interaction.reply({ embeds: [panelEmbed(interaction.guild.id, interaction.user.username)], components: [panelRow()] });
  },
};
