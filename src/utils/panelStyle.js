const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Each module gets its own accent color instead of one blue for everything.
const MODULE_COLORS = {
  antinuke: '#C0392B', // deep red — danger/security
  automod: '#8E44AD', // purple — filtering/AI-ish
  moderation: '#D68910', // amber — action/warning
  rolelock: '#16A085', // teal — protection
  modperms: '#2E4053', // slate — permissions/structure
  ticket: '#27AE60', // green — support
  autorole: '#D35400', // burnt orange — roles
  noprefix: '#5D6D7E', // muted grey-blue — utility
};

/**
 * Builds a panel embed using a compact single-block layout (author line +
 * one description block with a light code-style status readout) instead of
 * a big icon title with a row of separate inline fields.
 */
function buildPanelEmbed({ moduleKey, moduleLabel, tagline, statusLines, note, requestedBy }) {
  const embed = new EmbedBuilder()
    .setColor(MODULE_COLORS[moduleKey] || '#5D6D7E')
    .setAuthor({ name: `${moduleLabel} · Control Panel` })
    .setDescription(
      [tagline ? `*${tagline}*` : null, '', '```', statusLines.join('\n'), '```', note ? `\n${note}` : null].filter(Boolean).join('\n'),
    )
    .setFooter({ text: `⚙ Panel opened by ${requestedBy}` });
  return embed;
}

/** A single, small close button — always the same style/spot across every panel. */
function closeButton(customId) {
  return new ButtonBuilder().setCustomId(customId).setLabel('✕').setStyle(ButtonStyle.Secondary);
}

module.exports = { MODULE_COLORS, buildPanelEmbed, closeButton, ActionRowBuilder, ButtonBuilder, ButtonStyle };
