const { SlashCommandBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger');

module.exports = {
  moderationCommand: true,
  data: new SlashCommandBuilder()
    .setName('hackban')
    .setDescription("Ban a user by ID even if they're not in the server")
    .addStringOption((opt) => opt.setName('user_id').setDescription('User ID to ban').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason').setRequired(false)),

  async execute(interaction) {
    const userId = interaction.options.getString('user_id');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!/^\d{15,20}$/.test(userId)) {
      return interaction.reply({ content: 'That doesn\'t look like a valid user ID.', ephemeral: true });
    }

    try {
      await interaction.guild.members.ban(userId, { reason });
      await interaction.reply(`Hackbanned \`${userId}\`. Reason: ${reason}`);
      await logAction(interaction.guild, {
        type: 'mod',
        title: 'Hackban',
        fields: [
          { name: 'User ID', value: userId },
          { name: 'Moderator', value: `${interaction.user.tag}` },
          { name: 'Reason', value: reason },
        ],
      });
    } catch (err) {
      await interaction.reply({ content: 'Could not ban that ID — check it\'s correct.', ephemeral: true });
    }
  },
};
