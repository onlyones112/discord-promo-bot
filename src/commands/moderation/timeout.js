const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger');

module.exports = {
  moderationCommand: true,
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member for a set duration')
    .addUserOption((opt) => opt.setName('user').setDescription('User to timeout').setRequired(true))
    .addIntegerOption((opt) => opt.setName('minutes').setDescription('Duration in minutes (max 40320 = 28 days)').setMinValue(1).setMaxValue(40320).setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
    if (!member.moderatable) return interaction.reply({ content: "I can't timeout this user (role hierarchy or missing permission).", ephemeral: true });

    await member.timeout(minutes * 60 * 1000, reason);

    const embed = new EmbedBuilder()
      .setColor('#FEE75C')
      .setTitle('Member Timed Out')
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})` },
        { name: 'Duration', value: `${minutes} minute(s)` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
        { name: 'Reason', value: reason },
      );

    await interaction.reply({ embeds: [embed] });
    await logAction(interaction.guild, {
      type: 'mod',
      title: 'Member Timed Out',
      color: '#FEE75C',
      fields: [
        { name: 'User', value: `${user.tag} (${user.id})` },
        { name: 'Duration', value: `${minutes} minute(s)` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
        { name: 'Reason', value: reason },
      ],
    });
  },
};
