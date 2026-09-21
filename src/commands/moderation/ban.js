const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger');
const { getModPerms, checkAndRecordLimit } = require('../../utils/modPermsCheck');

module.exports = {
  moderationCommand: true,
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption((opt) => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason').setRequired(false))
    .addIntegerOption((opt) =>
      opt.setName('delete_days').setDescription('Delete this many days of their messages (0-7)').setMinValue(0).setMaxValue(7).setRequired(false),
    ),

  async execute(interaction) {
    const { banKickLimit } = getModPerms(interaction.guild.id);
    if (banKickLimit && !checkAndRecordLimit(interaction.guild.id, interaction.user.id, banKickLimit)) {
      return interaction.reply({ content: `You've hit the ban/kick limit (${banKickLimit.count} per ${banKickLimit.hours}h). Try again later.`, ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.reply({ content: "I can't ban this user (role hierarchy or missing permission).", ephemeral: true });
    }

    await interaction.guild.members.ban(user.id, { deleteMessageSeconds: deleteDays * 86400, reason });

    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('Member Banned')
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
        { name: 'Reason', value: reason },
      );

    await interaction.reply({ embeds: [embed] });
    await logAction(interaction.guild, {
      type: 'mod',
      title: 'Member Banned',
      color: '#ED4245',
      fields: [
        { name: 'User', value: `${user.tag} (${user.id})` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
        { name: 'Reason', value: reason },
      ],
    });
  },
};
