const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listjoinpos')
    .setDescription("Show a member's join position (e.g. 42nd to join)")
    .addUserOption((opt) => opt.setName('user').setDescription('User to check (defaults to you)').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    await interaction.deferReply();
    const members = await interaction.guild.members.fetch();
    const sorted = [...members.values()].sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
    const position = sorted.findIndex((m) => m.id === user.id);

    if (position === -1) return interaction.editReply(`${user.tag} is not in this server.`);
    await interaction.editReply(`${user.tag} was the **${position + 1}${ordinalSuffix(position + 1)}** member to join this server.`);
  },
};

function ordinalSuffix(n) {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}
