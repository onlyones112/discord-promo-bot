const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isTicketChannel, parseTicketTopic } = require('../../utils/ticketHelpers');
const { getConfig } = require('../../utils/guildConfig');
const { logAction } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder().setName('closeticket').setDescription('Close this ticket').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!isTicketChannel(interaction.channel)) {
      return interaction.reply({ content: 'This command only works inside a ticket channel.', ephemeral: true });
    }

    const { closedCategoryId } = getConfig(interaction.guild.id);
    const info = parseTicketTopic(interaction.channel.topic);

    if (!closedCategoryId) {
      await interaction.reply('Closing this ticket in 5 seconds...');
      await logAction(interaction.guild, { type: 'tickets', title: 'Ticket Closed (deleted)', color: '#ED4245', fields: [{ name: 'Channel', value: `#${interaction.channel.name}` }, { name: 'Closed by', value: `${interaction.user.tag}` }] });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      return;
    }

    try {
      await interaction.channel.setParent(closedCategoryId, { lockPermissions: false });
      if (info?.ownerId) await interaction.channel.permissionOverwrites.edit(info.ownerId, { SendMessages: false });
      await interaction.channel.setName(`closed-${interaction.channel.name}`.slice(0, 90)).catch(() => {});
    } catch {
      return interaction.reply({ content: "Couldn't move this ticket to the closed category.", ephemeral: true });
    }

    const embed = new EmbedBuilder().setColor('#ED4245').setTitle('Ticket Closed').setDescription(`Closed by ${interaction.user}. Moved to the archive.`);
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_delete').setLabel('Delete Permanently').setEmoji('🗑️').setStyle(ButtonStyle.Danger));

    await interaction.reply({ embeds: [embed], components: [row] });
    await logAction(interaction.guild, { type: 'tickets', title: 'Ticket Closed (archived)', color: '#ED4245', fields: [{ name: 'Channel', value: `#${interaction.channel.name}` }, { name: 'Closed by', value: `${interaction.user.tag}` }] });
  },
};
