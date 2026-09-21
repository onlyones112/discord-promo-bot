const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getConfig } = require('../utils/guildConfig');

function panelEmbed(guildId, requestedBy) {
  const { closedCategoryId } = getConfig(guildId);
  return new EmbedBuilder()
    .setColor('#2F80ED')
    .setTitle('🎫 Configure Tickets')
    .setDescription(
      'Manage where closed tickets get archived.\n\n' +
        'To post a new ticket button for a category (Support, Buy/Sell, etc.), use `/ticket-panel` — one run per ticket type.',
    )
    .addFields({ name: 'Closed-Ticket Category', value: closedCategoryId ? `<#${closedCategoryId}>` : 'Not set (tickets delete instead of archiving)' })
    .setFooter({ text: `Requested By | ${requestedBy}` });
}

function panelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_ticket_closedcategory').setLabel('Set Closed Category').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('panel_ticket_close').setLabel('Close').setStyle(ButtonStyle.Danger),
  );
}

module.exports = {
  panelEmbed,
  panelRow,

  data: new SlashCommandBuilder().setName('ticket-config-panel').setDescription('Open an interactive ticket configuration panel').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.reply({ embeds: [panelEmbed(interaction.guild.id, interaction.user.username)], components: [panelRow()] });
  },
};
