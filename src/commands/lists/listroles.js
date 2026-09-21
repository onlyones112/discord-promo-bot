const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('listroles').setDescription('List every role in this server'),

  async execute(interaction) {
    const roles = [...interaction.guild.roles.cache.values()].filter((r) => r.id !== interaction.guild.id).sort((a, b) => b.position - a.position);

    if (roles.length === 0) return interaction.reply({ content: 'No roles found.', ephemeral: true });

    const lines = roles.map((r) => `${r} — ${r.members.size} member(s)`);
    const embed = new EmbedBuilder().setColor('#2F80ED').setTitle(`Roles (${roles.length})`).setDescription(lines.join('\n').slice(0, 4000));

    await interaction.reply({ embeds: [embed] });
  },
};
