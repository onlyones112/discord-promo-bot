const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getConfig } = require('../utils/guildConfig');
const { buildPanelEmbed } = require('../utils/panelStyle');

function panelEmbed(guild, requestedBy) {
  const { logs } = getConfig(guild.id);
  const modLogId = logs?.mod;
  return buildPanelEmbed({
    moduleKey: 'moderation',
    moduleLabel: 'Moderation',
    tagline: `Quick actions for #${guild.name}. Kick/ban/warn/timeout need a target user — use their slash commands directly.`,
    statusLines: [`mod log channel . ${modLogId ? '#' + modLogId : '—'}`],
    requestedBy,
  });
}

function panelRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_mod_lock').setLabel('Lock').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_mod_unlock').setLabel('Unlock').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_mod_purge10').setLabel('Purge 10').setEmoji('🧹').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_mod_logchannel').setLabel('Log Channel').setEmoji('📁').setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('panel_mod_close').setLabel('Dismiss').setEmoji('✕').setStyle(ButtonStyle.Secondary));
  return [row1, row2];
}

module.exports = {
  panelEmbed,
  panelRows,

  data: new SlashCommandBuilder().setName('moderation-panel').setDescription('Open the Moderation control panel').setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    await interaction.reply({ embeds: [panelEmbed(interaction.guild, interaction.user.username)], components: panelRows() });
  },
};
