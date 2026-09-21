const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isTicketChannel, parseTicketTopic } = require('../../utils/ticketHelpers');

module.exports = {
  data: new SlashCommandBuilder().setName('showticket').setDescription('Show info about this ticket'),

  async execute(interaction) {
    if (!isTicketChannel(interaction.channel)) {
      return interaction.reply({ content: 'This command only works inside a ticket channel.', ephemeral: true });
    }
    const info = parseTicketTopic(interaction.channel.topic);
    const isClosed = interaction.channel.name.startsWith('closed-');

    const embed = new EmbedBuilder()
      .setColor('#2F80ED')
      .setTitle('🎫 Ticket Info')
      .addFields(
        { name: 'Opened By', value: `<@${info.ownerId}>`, inline: true },
        { name: 'Type', value: info.type || 'unknown', inline: true },
        { name: 'Status', value: isClosed ? '🔒 Closed' : '🟢 Open', inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
