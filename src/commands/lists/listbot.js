const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('listbot').setDescription('List every bot in this server'),

  async execute(interaction) {
    await interaction.deferReply();
    const members = await interaction.guild.members.fetch();
    const bots = members.filter((m) => m.user.bot);

    if (bots.size === 0) return interaction.editReply('No bots in this server.');

    const lines = bots.map((m) => `${m}`);
    const embed = new EmbedBuilder().setColor('#2F80ED').setTitle(`Bots (${bots.size})`).setDescription(lines.join('\n').slice(0, 4000));

    await interaction.editReply({ embeds: [embed] });
  },
};
