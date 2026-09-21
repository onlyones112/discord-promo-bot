const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig } = require('../utils/guildConfig');
const { canRunModCommand, MODERATION_COMMANDS } = require('../utils/modPermsCheck');

function getModPermsFull(guildId) {
  const { modPerms } = getConfig(guildId);
  return { roles: {}, muteRoleId: null, banKickLimit: null, ...(modPerms || {}) };
}

module.exports = {
  getModPermsFull,

  data: new SlashCommandBuilder()
    .setName('modperms')
    .setDescription('Configure per-role moderation command permissions')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('grant')
        .setDescription('Give a role access to a specific moderation command (without native Discord permission)')
        .addRoleOption((opt) => opt.setName('role').setDescription('Role to grant').setRequired(true))
        .addStringOption((opt) => opt.setName('command').setDescription('Command name').setRequired(true).addChoices(...MODERATION_COMMANDS.map((c) => ({ name: c, value: c })))),
    )
    .addSubcommand((sub) =>
      sub
        .setName('revoke')
        .setDescription('Remove a role\'s access to a specific moderation command')
        .addRoleOption((opt) => opt.setName('role').setDescription('Role').setRequired(true))
        .addStringOption((opt) => opt.setName('command').setDescription('Command name').setRequired(true).addChoices(...MODERATION_COMMANDS.map((c) => ({ name: c, value: c })))),
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List all configured role -> command grants'))
    .addSubcommand((sub) =>
      sub
        .setName('set-mute-role')
        .setDescription('Set the role used for chat-mute style commands')
        .addRoleOption((opt) => opt.setName('role').setDescription('Mute role').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('set-bankick-limit')
        .setDescription('Limit how many bans/kicks a moderator can do per time window')
        .addIntegerOption((opt) => opt.setName('count').setDescription('Max bans/kicks').setMinValue(1).setRequired(true))
        .addIntegerOption((opt) => opt.setName('hours').setDescription('Time window in hours').setMinValue(1).setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('clear-bankick-limit').setDescription('Remove the ban/kick limit'))
    .addSubcommand((sub) => sub.setName('reset').setDescription('Clear all ModPerms configuration'))
    .addSubcommand((sub) => sub.setName('view').setDescription('Show which commands YOU can currently run')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const current = getModPermsFull(interaction.guild.id);

    if (sub === 'grant') {
      const role = interaction.options.getRole('role');
      const command = interaction.options.getString('command');
      const roles = { ...current.roles };
      roles[role.id] = [...new Set([...(roles[role.id] || []), command])];
      setConfig(interaction.guild.id, { modPerms: { ...current, roles } });
      return interaction.reply(`${role} can now use \`/${command}\` even without the native Discord permission.`);
    }

    if (sub === 'revoke') {
      const role = interaction.options.getRole('role');
      const command = interaction.options.getString('command');
      const roles = { ...current.roles };
      roles[role.id] = (roles[role.id] || []).filter((c) => c !== command);
      setConfig(interaction.guild.id, { modPerms: { ...current, roles } });
      return interaction.reply(`Removed \`/${command}\` access from ${role} (this doesn't affect native Discord permissions).`);
    }

    if (sub === 'list') {
      const entries = Object.entries(current.roles).filter(([, cmds]) => cmds.length > 0);
      if (entries.length === 0) return interaction.reply({ content: 'No custom grants configured yet.', ephemeral: true });
      const lines = entries.map(([roleId, cmds]) => `<@&${roleId}> — ${cmds.map((c) => `\`${c}\``).join(', ')}`);
      return interaction.reply({ content: lines.join('\n'), ephemeral: true });
    }

    if (sub === 'set-mute-role') {
      const role = interaction.options.getRole('role');
      setConfig(interaction.guild.id, { modPerms: { ...current, muteRoleId: role.id } });
      return interaction.reply(`Mute role set to ${role}.`);
    }

    if (sub === 'set-bankick-limit') {
      const count = interaction.options.getInteger('count');
      const hours = interaction.options.getInteger('hours');
      setConfig(interaction.guild.id, { modPerms: { ...current, banKickLimit: { count, hours } } });
      return interaction.reply(`Ban/kick limit set to **${count} per ${hours}h** per moderator.`);
    }

    if (sub === 'clear-bankick-limit') {
      setConfig(interaction.guild.id, { modPerms: { ...current, banKickLimit: null } });
      return interaction.reply('Ban/kick limit removed.');
    }

    if (sub === 'reset') {
      setConfig(interaction.guild.id, { modPerms: { roles: {}, muteRoleId: null, banKickLimit: null } });
      return interaction.reply('All ModPerms configuration cleared.');
    }

    if (sub === 'view') {
      const member = interaction.member;
      if (member.guild.ownerId === member.id || member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: `**Status:** Server Owner/Administrator (Full Bypass)\n**Accessible Commands:** All ${MODERATION_COMMANDS.length} commands`, ephemeral: true });
      }
      const accessible = MODERATION_COMMANDS.filter((c) => canRunModCommand(member, c));
      return interaction.reply({
        content: `**Total Commands:** ${accessible.length} / ${MODERATION_COMMANDS.length}\n**Accessible:** ${accessible.length ? accessible.map((c) => `\`${c}\``).join(', ') : 'None'}`,
        ephemeral: true,
      });
    }
  },
};
