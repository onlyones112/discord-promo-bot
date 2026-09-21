const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../utils/inviteStore');

module.exports = {
  data: new SlashCommandBuilder().setName('invitesleaderboard').setDescription('Top inviters in this server'),

  async execute(interaction) {
    const top = getLeaderboard(interaction.guild.id, 10);
    if (top.length === 0) {
      return interaction.reply({ content: 'No invite data yet.', ephemeral: true });
    }

    const lines = top.map((entry, i) => `**${i + 1}.** <@${entry.userId}> — ${entry.total} invite${entry.total === 1 ? '' : 's'}`);
    const embed = new EmbedBuilder().setColor('#2F80ED').setTitle('🏆 Invite Leaderboard').setDescription(lines.join('\n'));

    await interaction.reply({ embeds: [embed] });
  },
};
