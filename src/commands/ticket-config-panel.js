const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getConfig } = require('../utils/guildConfig');
const { buildPanelEmbed } = require('../utils/panelStyle');

function panelEmbed(guildId, requestedBy) {
  const { closedCategoryId } = getConfig(guildId);
  return buildPanelEmbed({
    moduleKey: 'ticket',
    moduleLabel: 'Tickets',
    tagline: 'To post a new ticket button for a category, use `/ticket-panel` (one run per type).',
    statusLines: [`closed category . ${closedCategoryId ? '#' + closedCategoryId : 'not set (deletes instead)'}`],
    requestedBy,
  });
}

function panelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_ticket_closedcategory').setLabel('Closed Category').setEmoji('📥').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_ticket_close').setLabel('Dismiss').setEmoji('✕').setStyle(ButtonStyle.Secondary),
  );
}

module.exports = {
  panelEmbed,
  panelRow,

  data: new SlashCommandBuilder().setName('ticket-config-panel').setDescription('Open the ticket configuration panel').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.reply({ embeds: [panelEmbed(interaction.guild.id, interaction.user.username)], components: [panelRow()] });
  },
};
