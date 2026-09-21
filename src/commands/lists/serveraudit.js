const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig } = require('../../utils/guildConfig');
const { getAntinuke } = require('../antinuke');
const { getAutomod } = require('../automod');
const { getRoleLock } = require('../rolelock');

module.exports = {
  data: new SlashCommandBuilder().setName('serveraudit').setDescription("Security health-check of this server's bot configuration").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const antinuke = getAntinuke(guildId);
    const automod = getAutomod(guildId);
    const rolelock = getRoleLock(guildId);
    const config = getConfig(guildId);

    const automodOn = Object.values(automod).some(Boolean);
    const logsConfigured = config.logs ? Object.keys(config.logs).length : 0;

    const embed = new EmbedBuilder()
      .setColor('#2F80ED')
      .setTitle(`🔍 Security Audit — ${interaction.guild.name}`)
      .addFields(
        { name: 'Antinuke', value: antinuke.enabled ? '✅ Enabled' : '❌ Disabled — recommend enabling', inline: true },
        { name: 'AutoMod', value: automodOn ? '✅ At least one filter on' : '⚠️ All filters off', inline: true },
        { name: 'RoleLock', value: rolelock.enabled ? `✅ Enabled (${rolelock.lockedRoles.length} role(s))` : '❌ Disabled', inline: true },
        { name: 'Log Channels', value: `${logsConfigured}/7 types configured`, inline: true },
        { name: 'Autorole', value: config.autorole?.humanRoleIds?.length ? '✅ Configured' : '➖ Not set', inline: true },
        { name: '2FA-only Admins', value: 'Check manually in Server Settings → Safety', inline: true },
      )
      .setFooter({ text: 'Run /antinuke enable, /automod toggle, /rolelock add, /setlogs auto to close gaps' });

    await interaction.reply({ embeds: [embed] });
  },
};
