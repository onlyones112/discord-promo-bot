const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isTicketChannel } = require('../../utils/ticketHelpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('renameticket')
    .setDescription('Rename this ticket channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((opt) => opt.setName('name').setDescription('New channel name').setRequired(true)),

  async execute(interaction) {
    if (!isTicketChannel(interaction.channel)) {
      return interaction.reply({ content: 'This command only works inside a ticket channel.', ephemeral: true });
    }
    const name = interaction.options.getString('name').toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 90);
    await interaction.channel.setName(name);
    await interaction.reply(`Ticket renamed to **${name}**.`);
  },
};
