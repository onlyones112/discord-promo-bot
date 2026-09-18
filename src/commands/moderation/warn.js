const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addWarning, getWarnings, clearWarnings } = require('../../utils/warnStore');
const { logAction } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn management')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Warn a member')
        .addUserOption((opt) => opt.setName('user').setDescription('User to warn').setRequired(true))
        .addStringOption((opt) => opt.setName('reason').setDescription('Reason').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription("List a member's warnings")
        .addUserOption((opt) => opt.setName('user').setDescription('User to check').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription("Clear a member's warnings")
        .addUserOption((opt) => opt.setName('user').setDescription('User to clear').setRequired(true)),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');

    if (sub === 'add') {
      const reason = interaction.options.getString('reason');
      const count = addWarning(interaction.guild.id, user.id, reason, interaction.user.id);
      const embed = new EmbedBuilder()
        .setColor('#FEE75C')
        .setTitle('Member Warned')
        .addFields(
          { name: 'User', value: `${user.tag} (${user.id})` },
          { name: 'Reason', value: reason },
          { name: 'Total Warnings', value: `${count}` },
        );
      await interaction.reply({ embeds: [embed] });
      await user.send(`You were warned in **${interaction.guild.name}**: ${reason}`).catch(() => {});
      await logAction(interaction.guild, {
        title: 'Member Warned',
        color: '#FEE75C',
        fields: [
          { name: 'User', value: `${user.tag} (${user.id})` },
          { name: 'Moderator', value: `${interaction.user.tag}` },
          { name: 'Reason', value: reason },
          { name: 'Total Warnings', value: `${count}` },
        ],
      });
      return;
    }

    if (sub === 'list') {
      const warnings = getWarnings(interaction.guild.id, user.id);
      if (warnings.length === 0) {
        return interaction.reply({ content: `${user.tag} has no warnings.`, ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`Warnings for ${user.tag}`)
        .setDescription(warnings.map((w, i) => `**${i + 1}.** ${w.reason} — <t:${Math.floor(new Date(w.date).getTime() / 1000)}:R>`).join('\n'));
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'clear') {
      clearWarnings(interaction.guild.id, user.id);
      return interaction.reply(`Cleared all warnings for ${user.tag}.`);
    }
  },
};
