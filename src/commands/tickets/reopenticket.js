const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isTicketChannel, parseTicketTopic } = require('../../utils/ticketHelpers');
const { logAction } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder().setName('reopenticket').setDescription('Reopen a closed ticket').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!isTicketChannel(interaction.channel)) {
      return interaction.reply({ content: 'This command only works inside a ticket channel.', ephemeral: true });
    }
    if (!interaction.channel.name.startsWith('closed-')) {
      return interaction.reply({ content: 'This ticket is not closed.', ephemeral: true });
    }

    const info = parseTicketTopic(interaction.channel.topic);
    if (!info?.originalCategoryId) {
      return interaction.reply({ content: "Can't find the original category for this ticket — move it manually.", ephemeral: true });
    }

    try {
      await interaction.channel.setParent(info.originalCategoryId, { lockPermissions: false });
      if (info.ownerId) await interaction.channel.permissionOverwrites.edit(info.ownerId, { SendMessages: true, ViewChannel: true });
      const newName = interaction.channel.name.replace(/^closed-/, '');
      await interaction.channel.setName(newName).catch(() => {});
    } catch {
      return interaction.reply({ content: "Couldn't reopen — check the original category still exists and I have permission there.", ephemeral: true });
    }

    await interaction.reply(`🔓 Ticket reopened by ${interaction.user}.`);
    await logAction(interaction.guild, { type: 'tickets', title: 'Ticket Reopened', color: '#57F287', fields: [{ name: 'Channel', value: `#${interaction.channel.name}` }, { name: 'Reopened by', value: `${interaction.user.tag}` }] });
  },
};
