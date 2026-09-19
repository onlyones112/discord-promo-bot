const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setConfig, getConfig } = require('../utils/guildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Automatically give a role to new members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Set the role to auto-give on join')
        .addRoleOption((opt) => opt.setName('role').setDescription('Role to give new members').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('disable').setDescription('Turn off autorole'))
    .addSubcommand((sub) => sub.setName('view').setDescription('Show current autorole')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const role = interaction.options.getRole('role');
      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({ content: "I can't assign a role higher than or equal to my own highest role.", ephemeral: true });
      }
      setConfig(interaction.guild.id, { autoRoleId: role.id });
      return interaction.reply(`New members will automatically get ${role}.`);
    }

    if (sub === 'disable') {
      setConfig(interaction.guild.id, { autoRoleId: null });
      return interaction.reply('Autorole disabled.');
    }

    if (sub === 'view') {
      const { autoRoleId } = getConfig(interaction.guild.id);
      if (!autoRoleId) return interaction.reply({ content: 'No autorole set.', ephemeral: true });
      return interaction.reply({ content: `Current autorole: <@&${autoRoleId}>`, ephemeral: true });
    }
  },
};
