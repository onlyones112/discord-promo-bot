const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isTicketChannel } = require('../../utils/ticketHelpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adduser')
    .setDescription('Add a user to this ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((opt) => opt.setName('user').setDescription('User to add').setRequired(true)),

  async execute(interaction) {
    if (!isTicketChannel(interaction.channel)) {
      return interaction.reply({ content: 'This command only works inside a ticket channel.', ephemeral: true });
    }
    const user = interaction.options.getUser('user');
    await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
    await interaction.reply(`Added ${user} to this ticket.`);
  },
};
