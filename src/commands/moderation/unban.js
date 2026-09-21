const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../../utils/logger');

module.exports = {
  moderationCommand: true,
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by ID')
    .addStringOption((opt) => opt.setName('user_id').setDescription('The user ID to unban').setRequired(true)),

  async execute(interaction) {
    const userId = interaction.options.getString('user_id');
    try {
      await interaction.guild.members.unban(userId);
      await interaction.reply(`Unbanned <@${userId}> (${userId}).`);
      await logAction(interaction.guild, {
      type: 'mod',
        title: 'Member Unbanned',
        color: '#57F287',
        fields: [
          { name: 'User ID', value: userId },
          { name: 'Moderator', value: `${interaction.user.tag}` },
        ],
      });
    } catch {
      await interaction.reply({ content: 'Could not unban that ID (not banned, or invalid ID).', ephemeral: true });
    }
  },
};
