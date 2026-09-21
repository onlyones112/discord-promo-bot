const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getStats } = require('../../utils/inviteStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription("Show a member's invite count")
    .addUserOption((opt) => opt.setName('user').setDescription('User to check (defaults to you)').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const stats = getStats(interaction.guild.id, user.id);
    const total = stats.regular + stats.bonus - stats.left;

    const embed = new EmbedBuilder()
      .setColor('#2F80ED')
      .setTitle(`${user.tag}'s Invites`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'Total', value: `${total}`, inline: true },
        { name: 'Regular', value: `${stats.regular}`, inline: true },
        { name: 'Fake', value: `${stats.fake}`, inline: true },
        { name: 'Left', value: `${stats.left}`, inline: true },
        { name: 'Bonus', value: `${stats.bonus}`, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
