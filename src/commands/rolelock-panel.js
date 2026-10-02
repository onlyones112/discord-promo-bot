const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getRoleLock } = require('./rolelock');
const { buildPanelEmbed } = require('../utils/panelStyle');

function panelEmbed(settings) {
  return buildPanelEmbed({
    moduleKey: 'rolelock',
    moduleLabel: 'RoleLock',
    tagline: 'Reverts unauthorized add/remove on protected roles automatically.',
    statusLines: [
      `status ......... ${settings.enabled ? 'ON' : 'OFF'}`,
      `protected roles . ${settings.lockedRoles.length}`,
      `trusted users ... ${settings.trusted.length}`,
    ],
    note: 'Use `/rolelock add` and `/rolelock trusted-add` to manage the lists.',
    requestedBy: 'the server',
  });
}

function panelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_rolelock_enable').setLabel('Enable').setEmoji('🔐').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_rolelock_disable').setLabel('Disable').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_rolelock_refresh').setLabel('Refresh').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
  );
}

module.exports = {
  panelEmbed,
  panelRow,

  data: new SlashCommandBuilder().setName('rolelock-panel').setDescription('Open the RoleLock control panel').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const settings = getRoleLock(interaction.guild.id);
    await interaction.reply({ embeds: [panelEmbed(settings)], components: [panelRow()] });
  },
};
