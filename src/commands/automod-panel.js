const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getAutomod } = require('./automod');
const { buildPanelEmbed } = require('../utils/panelStyle');

const FILTERS = [
  { key: 'invites', label: 'Invites', emoji: '🔗' },
  { key: 'links', label: 'Links', emoji: '🌐' },
  { key: 'mentions', label: 'Mention Spam', emoji: '📣' },
  { key: 'images', label: 'Images', emoji: '🖼️' },
];

function panelEmbed(settings) {
  return buildPanelEmbed({
    moduleKey: 'automod',
    moduleLabel: 'AutoMod',
    tagline: 'Word/link/mention filtering. Manage Messages holders are always exempt.',
    statusLines: FILTERS.map((f) => `${f.label.padEnd(14, '.')} ${settings[f.key] ? 'ON' : 'off'}`),
    requestedBy: 'the server',
  });
}

function panelRow(settings) {
  const row = new ActionRowBuilder();
  for (const f of FILTERS) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`panel_automod_toggle:${f.key}`)
        .setLabel(f.label)
        .setEmoji(f.emoji)
        .setStyle(settings[f.key] ? ButtonStyle.Danger : ButtonStyle.Secondary),
    );
  }
  return row;
}

module.exports = {
  panelEmbed,
  panelRow,

  data: new SlashCommandBuilder().setName('automod-panel').setDescription('Open the AutoMod control panel').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const settings = getAutomod(interaction.guild.id);
    await interaction.reply({ embeds: [panelEmbed(settings)], components: [panelRow(settings)] });
  },
};
