const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig } = require('../utils/guildConfig');

function getRoleLock(guildId) {
  const { roleLock } = getConfig(guildId);
  return roleLock || { enabled: false, lockedRoles: [], trusted: [] };
}

module.exports = {
  getRoleLock,

  data: new SlashCommandBuilder()
    .setName('rolelock')
    .setDescription('Protect specific roles from unauthorized add/remove')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub.setName('enable').setDescription('Turn RoleLock on'))
    .addSubcommand((sub) => sub.setName('disable').setDescription('Turn RoleLock off'))
    .addSubcommand((sub) => sub.setName('add').setDescription('Protect a role').addRoleOption((opt) => opt.setName('role').setDescription('Role to protect').setRequired(true)))
    .addSubcommand((sub) => sub.setName('remove').setDescription('Unprotect a role').addRoleOption((opt) => opt.setName('role').setDescription('Role to unprotect').setRequired(true)))
    .addSubcommand((sub) => sub.setName('list').setDescription('List protected roles'))
    .addSubcommand((sub) =>
      sub.setName('trusted-add').setDescription('Let this user manage protected roles freely').addUserOption((opt) => opt.setName('user').setDescription('User to trust').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName('trusted-remove').setDescription('Remove a user from the trusted list').addUserOption((opt) => opt.setName('user').setDescription('User to remove').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('trusted-list').setDescription('List trusted users'))
    .addSubcommand((sub) => sub.setName('status').setDescription('Show full RoleLock status')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const current = getRoleLock(interaction.guild.id);

    if (sub === 'enable') {
      setConfig(interaction.guild.id, { roleLock: { ...current, enabled: true } });
      return interaction.reply('🔒 RoleLock is now **enabled**. Only trusted users can add/remove protected roles — anyone else who tries gets reverted automatically.');
    }

    if (sub === 'disable') {
      setConfig(interaction.guild.id, { roleLock: { ...current, enabled: false } });
      return interaction.reply('RoleLock is now **disabled**.');
    }

    if (sub === 'add') {
      const role = interaction.options.getRole('role');
      const lockedRoles = [...new Set([...current.lockedRoles, role.id])];
      setConfig(interaction.guild.id, { roleLock: { ...current, lockedRoles } });
      return interaction.reply(`${role} is now protected by RoleLock.`);
    }

    if (sub === 'remove') {
      const role = interaction.options.getRole('role');
      const lockedRoles = current.lockedRoles.filter((id) => id !== role.id);
      setConfig(interaction.guild.id, { roleLock: { ...current, lockedRoles } });
      return interaction.reply(`${role} is no longer protected.`);
    }

    if (sub === 'list') {
      if (current.lockedRoles.length === 0) return interaction.reply({ content: 'No roles are protected yet.', ephemeral: true });
      return interaction.reply({ content: current.lockedRoles.map((id) => `<@&${id}>`).join(', '), ephemeral: true });
    }

    if (sub === 'trusted-add') {
      const user = interaction.options.getUser('user');
      const trusted = [...new Set([...current.trusted, user.id])];
      setConfig(interaction.guild.id, { roleLock: { ...current, trusted } });
      return interaction.reply(`${user.tag} can now manage protected roles freely.`);
    }

    if (sub === 'trusted-remove') {
      const user = interaction.options.getUser('user');
      const trusted = current.trusted.filter((id) => id !== user.id);
      setConfig(interaction.guild.id, { roleLock: { ...current, trusted } });
      return interaction.reply(`${user.tag} removed from the trusted list.`);
    }

    if (sub === 'trusted-list') {
      if (current.trusted.length === 0) return interaction.reply({ content: 'No trusted users set.', ephemeral: true });
      return interaction.reply({ content: current.trusted.map((id) => `<@${id}>`).join(', '), ephemeral: true });
    }

    if (sub === 'status') {
      return interaction.reply({
        content:
          `**RoleLock:** ${current.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
          `**Protected roles:** ${current.lockedRoles.length ? current.lockedRoles.map((id) => `<@&${id}>`).join(', ') : 'None'}\n` +
          `**Trusted users:** ${current.trusted.length ? current.trusted.map((id) => `<@${id}>`).join(', ') : 'None'}`,
        ephemeral: true,
      });
    }
  },
};
