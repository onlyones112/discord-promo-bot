const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isTicketChannel } = require('../../utils/ticketHelpers');
const { logAction } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder().setName('deleteticket').setDescription('Permanently delete this ticket').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!isTicketChannel(interaction.channel)) {
      return interaction.reply({ content: 'This command only works inside a ticket channel.', ephemeral: true });
    }
    await interaction.reply('Deleting this ticket in 3 seconds...');
    await logAction(interaction.guild, { type: 'tickets', title: 'Ticket Deleted', color: '#ED4245', fields: [{ name: 'Channel', value: `#${interaction.channel.name}` }, { name: 'Deleted by', value: `${interaction.user.tag}` }] });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
  },
};
