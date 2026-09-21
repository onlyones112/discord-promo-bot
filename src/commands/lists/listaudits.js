const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listaudits')
    .setDescription('Show recent audit log entries, optionally filtered by user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
    .addUserOption((opt) => opt.setName('user').setDescription('Only show actions by this user').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    await interaction.deferReply();

    const logs = await interaction.guild.fetchAuditLogs({ limit: 15 });
    let entries = [...logs.entries.values()];
    if (user) entries = entries.filter((e) => e.executor?.id === user.id);
    entries = entries.slice(0, 10);

    if (entries.length === 0) return interaction.editReply('No matching audit log entries found.');

    const lines = entries.map((e) => `**${e.action}** by ${e.executor?.tag || 'Unknown'}${e.target ? ` → ${e.target.tag || e.target.name || e.target.id}` : ''} — <t:${Math.floor(e.createdTimestamp / 1000)}:R>`);
    const embed = new EmbedBuilder().setColor('#2F80ED').setTitle('📜 Recent Audit Log').setDescription(lines.join('\n'));

    await interaction.editReply({ embeds: [embed] });
  },
};
