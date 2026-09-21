const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('listbans').setDescription('List banned users').setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    await interaction.deferReply();
    const bans = await interaction.guild.bans.fetch();

    if (bans.size === 0) return interaction.editReply('No banned users.');

    const lines = [...bans.values()].slice(0, 25).map((b) => `${b.user.tag} (${b.user.id})${b.reason ? ` — ${b.reason}` : ''}`);
    const embed = new EmbedBuilder().setColor('#ED4245').setTitle(`Banned Users (${bans.size})`).setDescription(lines.join('\n').slice(0, 4000));
    if (bans.size > 25) embed.setFooter({ text: `Showing 25 of ${bans.size}` });

    await interaction.editReply({ embeds: [embed] });
  },
};
