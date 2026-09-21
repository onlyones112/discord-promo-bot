const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getConfig, setConfig } = require('../utils/guildConfig');

const MAX_PANELS = 3;

// customId format: ticket_create:<categoryId>:<roleId|none>:<labelSlug>
// Everything a click needs travels inside the button itself, so we don't
// need a database to remember which panel maps to which category.
function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 20) || 'ticket';
}

module.exports = {
  MAX_PANELS,

  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription(`Post an "open a ticket" panel for a specific category (up to ${MAX_PANELS} per server)`)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt.setName('category').setDescription('Category new tickets of this type get created under').addChannelTypes(ChannelType.GuildCategory).setRequired(true),
    )
    .addStringOption((opt) => opt.setName('label').setDescription('Short name for this ticket type, e.g. Support or Buy/Sell').setRequired(true))
    .addRoleOption((opt) => opt.setName('role').setDescription('Role to ping/give access when this type of ticket opens (e.g. Support or Sales)').setRequired(false))
    .addStringOption((opt) => opt.setName('title').setDescription('Panel embed title').setRequired(false))
    .addStringOption((opt) => opt.setName('description').setDescription('Panel embed description').setRequired(false)),

  async execute(interaction) {
    const existing = getConfig(interaction.guild.id).ticketPanels || [];
    if (existing.length >= MAX_PANELS) {
      return interaction.reply({ content: `You already have ${MAX_PANELS} ticket panels configured (the max). Remove one with \`/ticket-panels remove\` first.`, ephemeral: true });
    }

    const category = interaction.options.getChannel('category');
    const label = interaction.options.getString('label');
    const role = interaction.options.getRole('role');
    const title = interaction.options.getString('title') || `${label} — Need help?`;
    const description = interaction.options.getString('description') || `Click below to open a private **${label}** ticket with our team.`;

    const embed = new EmbedBuilder().setColor('#5865F2').setTitle(title).setDescription(description);

    const customId = `ticket_create:${category.id}:${role ? role.id : 'none'}:${slug(label)}`;
    if (customId.length > 100) {
      return interaction.reply({ content: 'That label is too long, try something shorter.', ephemeral: true });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(customId).setLabel(`Open ${label} Ticket`).setEmoji('🎫').setStyle(ButtonStyle.Primary),
    );

    const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

    setConfig(interaction.guild.id, {
      ticketPanels: [...existing, { messageId: msg.id, channelId: interaction.channel.id, label, categoryId: category.id, roleId: role ? role.id : null }],
    });

    await interaction.reply({ content: `Panel posted (${existing.length + 1}/${MAX_PANELS}). Tickets from this button will be created under **${category.name}**.`, ephemeral: true });
  },
};
