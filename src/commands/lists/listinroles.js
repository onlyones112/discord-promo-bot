const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listinroles')
    .setDescription('List members that have a specific role')
    .addRoleOption((opt) => opt.setName('role').setDescription('Role to check').setRequired(true)),

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    await interaction.deferReply();
    await interaction.guild.members.fetch();

    const members = role.members;
    if (members.size === 0) return interaction.editReply(`No members have ${role}.`);

    const lines = [...members.values()].slice(0, 50).map((m) => `${m}`);
    const embed = new EmbedBuilder().setColor('#2F80ED').setTitle(`Members with ${role.name} (${members.size})`).setDescription(lines.join(', ').slice(0, 4000));
    if (members.size > 50) embed.setFooter({ text: `Showing 50 of ${members.size}` });

    await interaction.editReply({ embeds: [embed] });
  },
};
