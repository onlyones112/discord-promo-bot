const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getModPermsFull } = require('./modperms');
const { buildPanelEmbed } = require('../utils/panelStyle');

function panelEmbed(guildId, requestedBy) {
  const current = getModPermsFull(guildId);
  const grantedRoles = Object.entries(current.roles).filter(([, cmds]) => cmds.length > 0).length;

  return buildPanelEmbed({
    moduleKey: 'modperms',
    moduleLabel: 'ModPerms',
    tagline: 'Grant specific commands to roles without native Discord permissions.',
    statusLines: [
      `roles granted ... ${grantedRoles}`,
      `mute role ....... ${current.muteRoleId ? 'set' : '—'}`,
      `ban/kick limit .. ${current.banKickLimit ? `${current.banKickLimit.count}/${current.banKickLimit.hours}h` : '—'}`,
    ],
    note: 'Use `/modperms grant role:@Role command:<name>` for specific grants.',
    requestedBy,
  });
}

function panelRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_modperms_role').setLabel('Mute Role').setEmoji('🔇').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_modperms_limit').setLabel('Ban/Kick Limit').setEmoji('⚖️').setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_modperms_reset').setLabel('Reset All').setEmoji('🗑️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_modperms_close').setLabel('Dismiss').setEmoji('✕').setStyle(ButtonStyle.Secondary),
  );
  return [row1, row2];
}

module.exports = {
  panelEmbed,
  panelRows,

  data: new SlashCommandBuilder().setName('modperms-panel').setDescription('Open the ModPerms control panel').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.reply({ embeds: [panelEmbed(interaction.guild.id, interaction.user.username)], components: panelRows() });
  },
};
