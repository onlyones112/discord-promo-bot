const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../../utils/logger');

module.exports = {
  moderationCommand: true,
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages in this channel')
    .addIntegerOption((opt) => opt.setName('amount').setDescription('Number of messages to delete (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
    .addUserOption((opt) => opt.setName('user').setDescription('Only delete messages from this user').setRequired(false)),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    let toDelete = messages;
    if (user) {
      toDelete = messages.filter((m) => m.author.id === user.id);
    }
    toDelete = [...toDelete.values()].slice(0, amount);

    const deleted = await interaction.channel.bulkDelete(toDelete, true).catch(() => null);

    if (!deleted) {
      return interaction.editReply('Could not delete messages (they may be older than 14 days).');
    }

    await interaction.editReply(`Deleted ${deleted.size} message(s).`);
    await logAction(interaction.guild, {
      type: 'mod',
      title: 'Messages Purged',
      color: '#ED4245',
      fields: [
        { name: 'Channel', value: `${interaction.channel}` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
        { name: 'Amount', value: `${deleted.size}` },
        ...(user ? [{ name: 'Filtered to user', value: `${user.tag}` }] : []),
      ],
    });
  },
};
