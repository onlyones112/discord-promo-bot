const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig } = require('../utils/guildConfig');

function getCustomRoleConfig(guildId) {
  const { customRole } = getConfig(guildId);
  return { reqRoleId: null, logChannelId: null, roles: {}, ...(customRole || {}) };
}

module.exports = {
  getCustomRoleConfig,

  data: new SlashCommandBuilder()
    .setName('customrole')
    .setDescription('Create and manage your own personal role')
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create your personal custom role')
        .addStringOption((opt) => opt.setName('name').setDescription('Role name').setRequired(true).setMaxLength(100))
        .addStringOption((opt) => opt.setName('color').setDescription('Hex color, e.g. #FF00AA').setRequired(false)),
    )
    .addSubcommand((sub) => sub.setName('rename').setDescription('Rename your custom role').addStringOption((opt) => opt.setName('name').setDescription('New name').setRequired(true)))
    .addSubcommand((sub) => sub.setName('color').setDescription('Recolor your custom role').addStringOption((opt) => opt.setName('color').setDescription('Hex color').setRequired(true)))
    .addSubcommand((sub) => sub.setName('delete').setDescription('Delete your custom role'))
    .addSubcommand((sub) => sub.setName('list').setDescription('List everyone with a custom role (admin)'))
    .addSubcommand((sub) =>
      sub
        .setName('reqrole')
        .setDescription('Set which role is required to use /customrole (admin)')
        .addRoleOption((opt) => opt.setName('role').setDescription('Required role, e.g. Server Booster').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('logschannel')
        .setDescription('Set the log channel for custom role activity (admin)')
        .addChannelOption((opt) => opt.setName('channel').setDescription('Log channel').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('config').setDescription('Show current CustomRole configuration'))
    .addSubcommand((sub) => sub.setName('reset').setDescription('Delete ALL custom roles (admin)')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const current = getCustomRoleConfig(interaction.guild.id);

    const adminSubs = ['list', 'reqrole', 'logschannel', 'reset'];
    if (adminSubs.includes(sub) && !interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: 'You need Manage Roles permission for that.', ephemeral: true });
    }

    if (sub === 'create') {
      if (current.roles[interaction.user.id]) {
        return interaction.reply({ content: 'You already have a custom role — use `/customrole rename` or `/customrole color` to edit it.', ephemeral: true });
      }
      if (current.reqRoleId && !interaction.member.roles.cache.has(current.reqRoleId) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: `You need <@&${current.reqRoleId}> to create a custom role.`, ephemeral: true });
      }

      const name = interaction.options.getString('name');
      const color = interaction.options.getString('color') || undefined;

      try {
        const role = await interaction.guild.roles.create({ name, color, reason: `Custom role for ${interaction.user.tag}` });
        await interaction.member.roles.add(role);
        setConfig(interaction.guild.id, { customRole: { ...current, roles: { ...current.roles, [interaction.user.id]: role.id } } });
        await interaction.reply(`Created your custom role: ${role}`);

        if (current.logChannelId) {
          const channel = await interaction.guild.channels.fetch(current.logChannelId).catch(() => null);
          if (channel) await channel.send(`🎨 ${interaction.user} created custom role ${role}.`);
        }
      } catch (err) {
        await interaction.reply({ content: "Couldn't create the role — check my Manage Roles permission and role position, or the color format.", ephemeral: true });
      }
    }

    if (sub === 'rename' || sub === 'color') {
      const roleId = current.roles[interaction.user.id];
      if (!roleId) return interaction.reply({ content: "You don't have a custom role yet — use `/customrole create` first.", ephemeral: true });
      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) return interaction.reply({ content: 'Your custom role seems to have been deleted manually.', ephemeral: true });

      if (sub === 'rename') {
        await role.setName(interaction.options.getString('name'));
        return interaction.reply(`Renamed your custom role to **${role.name}**.`);
      } else {
        await role.setColor(interaction.options.getString('color'));
        return interaction.reply(`Recolored your custom role.`);
      }
    }

    if (sub === 'delete') {
      const roleId = current.roles[interaction.user.id];
      if (!roleId) return interaction.reply({ content: "You don't have a custom role.", ephemeral: true });
      const role = interaction.guild.roles.cache.get(roleId);
      if (role) await role.delete().catch(() => {});
      const roles = { ...current.roles };
      delete roles[interaction.user.id];
      setConfig(interaction.guild.id, { customRole: { ...current, roles } });
      return interaction.reply('Your custom role has been deleted.');
    }

    if (sub === 'list') {
      const entries = Object.entries(current.roles);
      if (entries.length === 0) return interaction.reply({ content: 'No custom roles created yet.', ephemeral: true });
      return interaction.reply({ content: entries.map(([userId, roleId]) => `<@${userId}> → <@&${roleId}>`).join('\n'), ephemeral: true });
    }

    if (sub === 'reqrole') {
      const role = interaction.options.getRole('role');
      setConfig(interaction.guild.id, { customRole: { ...current, reqRoleId: role.id } });
      return interaction.reply(`Only members with ${role} can now create a custom role.`);
    }

    if (sub === 'logschannel') {
      const channel = interaction.options.getChannel('channel');
      setConfig(interaction.guild.id, { customRole: { ...current, logChannelId: channel.id } });
      return interaction.reply(`Custom role activity will be logged in ${channel}.`);
    }

    if (sub === 'config') {
      return interaction.reply({
        content:
          `**Required role:** ${current.reqRoleId ? `<@&${current.reqRoleId}>` : 'None (everyone can create one)'}\n` +
          `**Log channel:** ${current.logChannelId ? `<#${current.logChannelId}>` : 'Not set'}\n` +
          `**Total custom roles:** ${Object.keys(current.roles).length}`,
        ephemeral: true,
      });
    }

    if (sub === 'reset') {
      for (const roleId of Object.values(current.roles)) {
        const role = interaction.guild.roles.cache.get(roleId);
        if (role) await role.delete().catch(() => {});
      }
      setConfig(interaction.guild.id, { customRole: { ...current, roles: {} } });
      return interaction.reply('All custom roles have been deleted.');
    }
  },
};
