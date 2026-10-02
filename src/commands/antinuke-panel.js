const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getAntinuke } = require('./antinuke');
const { buildPanelEmbed } = require('../utils/panelStyle');

function panelEmbed(settings, requestedBy) {
  return buildPanelEmbed({
    moduleKey: 'antinuke',
    moduleLabel: 'Antinuke',
    tagline: 'Auto-response to mass channel/role deletion attempts.',
    statusLines: [
      `status ......... ${settings.enabled ? 'ON' : 'OFF'}`,
      `trusted owners .. ${settings.trustedOwners.length || 0}`,
      `punishment ...... ${settings.punishment}`,
      `log channel ..... ${settings.logChannelId ? '#' + settings.logChannelId : '—'}`,
      `quarantine role . ${settings.quarantineRoleId ? 'set' : '—'}`,
      `backup role ..... ${settings.backupQuarantineRoleId ? 'set' : '—'}`,
    ],
    requestedBy,
  });
}

function panelRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_antinuke_toggle').setLabel('Toggle').setEmoji('🛡️').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('panel_antinuke_trustedowner').setLabel('Add Trusted').setEmoji('🔑').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_antinuke_punishment').setLabel('Punishment').setEmoji('⚖️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_antinuke_logchannel').setLabel('Log Channel').setEmoji('📁').setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_antinuke_quarantine').setLabel('Quarantine Role').setEmoji('🧯').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_antinuke_close').setLabel('Dismiss').setEmoji('✕').setStyle(ButtonStyle.Secondary),
  );
  return [row1, row2];
}

module.exports = {
  panelEmbed,
  panelRows,

  data: new SlashCommandBuilder().setName('antinuke-panel').setDescription('Open the Antinuke control panel').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const settings = getAntinuke(interaction.guild.id);
    await interaction.reply({ embeds: [panelEmbed(settings, interaction.user.username)], components: panelRows() });
  },
};
