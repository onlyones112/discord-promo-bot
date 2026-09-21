const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getConfig, setConfig } = require('../utils/guildConfig');

const DEFAULTS = { enabled: false, trustedOwners: [], punishment: 'ban', logChannelId: null, quarantineRoleId: null, backupQuarantineRoleId: null };

function getAntinuke(guildId) {
  const { antinuke } = getConfig(guildId);
  return { ...DEFAULTS, ...(antinuke || {}) };
}

module.exports = {
  getAntinuke,

  data: new SlashCommandBuilder()
    .setName('antinuke')
    .setDescription('Protect the server from mass-destruction attacks (channel/role deletion spam)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub.setName('enable').setDescription('Turn Antinuke on'))
    .addSubcommand((sub) => sub.setName('disable').setDescription('Turn Antinuke off'))
    .addSubcommand((sub) =>
      sub
        .setName('trustedowner-add')
        .setDescription('Trust a user to bypass Antinuke (add other admins/bots here)')
        .addUserOption((opt) => opt.setName('user').setDescription('User to trust').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('trustedowner-remove')
        .setDescription('Remove a user from the trusted list')
        .addUserOption((opt) => opt.setName('user').setDescription('User to remove').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('punishment')
        .setDescription('What happens to an unauthorized nuker if there is no quarantine role set')
        .addStringOption((opt) =>
          opt
            .setName('type')
            .setDescription('Punishment type')
            .setRequired(true)
            .addChoices({ name: 'Ban', value: 'ban' }, { name: 'Kick', value: 'kick' }, { name: 'Timeout (24h)', value: 'timeout' }),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('logchannel')
        .setDescription('Where Antinuke actions get logged (overrides the general antinuke log type from /setlogs)')
        .addChannelOption((opt) => opt.setName('channel').setDescription('Log channel').addChannelTypes(ChannelType.GuildText).setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('quarantine-role')
        .setDescription('Instead of banning, strip roles and cage the attacker with this role')
        .addRoleOption((opt) => opt.setName('role').setDescription('Quarantine role').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('backup-quarantine-role')
        .setDescription('Used if the main quarantine role is missing or unusable')
        .addRoleOption((opt) => opt.setName('role').setDescription('Backup quarantine role').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('view').setDescription('Show current Antinuke settings')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const current = getAntinuke(interaction.guild.id);

    if (sub === 'enable') {
      setConfig(interaction.guild.id, { antinuke: { ...current, enabled: true } });
      return interaction.reply('🛡️ Antinuke is now **enabled**.');
    }

    if (sub === 'disable') {
      setConfig(interaction.guild.id, { antinuke: { ...current, enabled: false } });
      return interaction.reply('Antinuke is now **disabled**.');
    }

    if (sub === 'trustedowner-add') {
      const user = interaction.options.getUser('user');
      const trustedOwners = [...new Set([...current.trustedOwners, user.id])];
      setConfig(interaction.guild.id, { antinuke: { ...current, trustedOwners } });
      return interaction.reply(`${user.tag} is now trusted and won't be actioned by Antinuke.`);
    }

    if (sub === 'trustedowner-remove') {
      const user = interaction.options.getUser('user');
      const trustedOwners = current.trustedOwners.filter((id) => id !== user.id);
      setConfig(interaction.guild.id, { antinuke: { ...current, trustedOwners } });
      return interaction.reply(`${user.tag} removed from the trusted list.`);
    }

    if (sub === 'punishment') {
      const type = interaction.options.getString('type');
      setConfig(interaction.guild.id, { antinuke: { ...current, punishment: type } });
      return interaction.reply(`Punishment set to **${type}**.`);
    }

    if (sub === 'logchannel') {
      const channel = interaction.options.getChannel('channel');
      setConfig(interaction.guild.id, { antinuke: { ...current, logChannelId: channel.id } });
      return interaction.reply(`Antinuke actions will be logged in ${channel}.`);
    }

    if (sub === 'quarantine-role') {
      const role = interaction.options.getRole('role');
      setConfig(interaction.guild.id, { antinuke: { ...current, quarantineRoleId: role.id } });
      return interaction.reply(`Unauthorized nukers will now be quarantined with ${role} instead of punished directly.`);
    }

    if (sub === 'backup-quarantine-role') {
      const role = interaction.options.getRole('role');
      setConfig(interaction.guild.id, { antinuke: { ...current, backupQuarantineRoleId: role.id } });
      return interaction.reply(`Backup quarantine role set to ${role}.`);
    }

    if (sub === 'view') {
      const list = current.trustedOwners.length ? current.trustedOwners.map((id) => `<@${id}>`).join(', ') : 'None';
      return interaction.reply({
        content:
          `**Antinuke:** ${current.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
          `**Trusted Owners:** ${list}\n` +
          `**Punishment:** ${current.punishment}\n` +
          `**Log Channel:** ${current.logChannelId ? `<#${current.logChannelId}>` : 'Not set'}\n` +
          `**Quarantine Role:** ${current.quarantineRoleId ? `<@&${current.quarantineRoleId}>` : 'Not set'}\n` +
          `**Backup Quarantine Role:** ${current.backupQuarantineRoleId ? `<@&${current.backupQuarantineRoleId}>` : 'Not set'}`,
        ephemeral: true,
      });
    }
  },
};
