const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

module.exports = {
  data: new SlashCommandBuilder().setName('stats').setDescription("Show the bot's overall stats"),

  async execute(interaction) {
    const client = interaction.client;
    const memoryMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

    const embed = new EmbedBuilder()
      .setColor('#2F80ED')
      .setTitle(`${client.user.username} — Bot Stats`)
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Commands', value: `${client.commands.size}`, inline: true },
        { name: 'Ping', value: `${Math.round(client.ws.ping)}ms`, inline: true },
        { name: 'Uptime', value: formatUptime(client.uptime), inline: true },
        { name: 'Memory', value: `${memoryMb} MB`, inline: true },
        { name: 'Node.js', value: process.version, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
