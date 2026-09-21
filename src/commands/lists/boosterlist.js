const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('boosterlist').setDescription('List everyone currently boosting this server'),

  async execute(interaction) {
    await interaction.deferReply();
    const members = await interaction.guild.members.fetch();
    const boosters = members.filter((m) => m.premiumSince);

    if (boosters.size === 0) return interaction.editReply('No active boosters right now.');

    const sorted = [...boosters.values()].sort((a, b) => a.premiumSinceTimestamp - b.premiumSinceTimestamp);
    const lines = sorted.map((m) => `${m} — boosting since <t:${Math.floor(m.premiumSinceTimestamp / 1000)}:D>`);
    const embed = new EmbedBuilder().setColor('#F47FFF').setTitle(`Boosters (${boosters.size})`).setDescription(lines.join('\n').slice(0, 4000));

    await interaction.editReply({ embeds: [embed] });
  },
};
