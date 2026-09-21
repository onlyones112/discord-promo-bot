const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isTicketChannel } = require('../../utils/ticketHelpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeuser')
    .setDescription('Remove a user from this ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((opt) => opt.setName('user').setDescription('User to remove').setRequired(true)),

  async execute(interaction) {
    if (!isTicketChannel(interaction.channel)) {
      return interaction.reply({ content: 'This command only works inside a ticket channel.', ephemeral: true });
    }
    const user = interaction.options.getUser('user');
    await interaction.channel.permissionOverwrites.delete(user.id).catch(() => {});
    await interaction.reply(`Removed ${user} from this ticket.`);
  },
};
