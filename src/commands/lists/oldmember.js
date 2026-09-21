const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('oldmember').setDescription('Show the 10 longest-standing members of this server'),

  async execute(interaction) {
    await interaction.deferReply();
    const members = await interaction.guild.members.fetch();
    const sorted = [...members.values()].filter((m) => !m.user.bot).sort((a, b) => a.joinedTimestamp - b.joinedTimestamp).slice(0, 10);

    const lines = sorted.map((m, i) => `**${i + 1}.** ${m} — joined <t:${Math.floor(m.joinedTimestamp / 1000)}:D>`);
    const embed = new EmbedBuilder().setColor('#2F80ED').setTitle('👴 Oldest Members').setDescription(lines.join('\n'));

    await interaction.editReply({ embeds: [embed] });
  },
};
