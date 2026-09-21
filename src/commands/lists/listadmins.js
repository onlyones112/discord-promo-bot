const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('listadmins').setDescription('List members with Administrator permission'),

  async execute(interaction) {
    await interaction.deferReply();
    const members = await interaction.guild.members.fetch();
    const admins = members.filter((m) => m.permissions.has(PermissionFlagsBits.Administrator) && !m.user.bot);

    if (admins.size === 0) return interaction.editReply('No members with Administrator permission found.');
    await interaction.editReply(`**Administrators (${admins.size}):**\n${admins.map((m) => `${m}`).join(', ')}`);
  },
};
