const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger');
const { getModPerms, checkAndRecordLimit } = require('../../utils/modPermsCheck');

module.exports = {
  moderationCommand: true,
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption((opt) => opt.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason').setRequired(false)),

  async execute(interaction) {
    const { banKickLimit } = getModPerms(interaction.guild.id);
    if (banKickLimit && !checkAndRecordLimit(interaction.guild.id, interaction.user.id, banKickLimit)) {
      return interaction.reply({ content: `You've hit the ban/kick limit (${banKickLimit.count} per ${banKickLimit.hours}h). Try again later.`, ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
    if (!member.kickable) return interaction.reply({ content: "I can't kick this user (role hierarchy or missing permission).", ephemeral: true });

    await member.kick(reason);

    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('Member Kicked')
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
        { name: 'Reason', value: reason },
      );

    await interaction.reply({ embeds: [embed] });
    await logAction(interaction.guild, {
      type: 'mod',
      title: 'Member Kicked',
      color: '#ED4245',
      fields: [
        { name: 'User', value: `${user.tag} (${user.id})` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
        { name: 'Reason', value: reason },
      ],
    });
  },
};
