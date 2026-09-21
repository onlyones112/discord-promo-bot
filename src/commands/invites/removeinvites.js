const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { adjustStats } = require('../../utils/inviteStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeinvites')
    .setDescription("Subtract from a member's invite count (admin adjustment)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((opt) => opt.setName('user').setDescription('User').setRequired(true))
    .addIntegerOption((opt) => opt.setName('amount').setDescription('How many to remove').setMinValue(1).setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const updated = adjustStats(interaction.guild.id, user.id, { bonus: -amount });
    await interaction.reply(`Removed ${amount} invite(s) from ${user.tag}. New bonus total: ${updated.bonus}.`);
  },
};
