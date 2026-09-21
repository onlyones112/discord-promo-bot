const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getAntinuke } = require('./antinuke');

function panelEmbed(settings, requestedBy) {
  return new EmbedBuilder()
    .setColor('#2F80ED')
    .setTitle('🛡️ Configure Antinuke')
    .setDescription('Enhance server security with Antinuke and Trusted Owners.')
    .addFields(
      { name: 'Current Status', value: settings.enabled ? '✅ Enabled' : '❌ Disabled' },
      { name: 'Trusted Owners', value: settings.trustedOwners.length ? settings.trustedOwners.map((id) => `<@${id}>`).join(', ') : 'None' },
      { name: 'Log Channel', value: settings.logChannelId ? `<#${settings.logChannelId}>` : 'Not set' },
      { name: 'Punishment', value: settings.punishment },
      { name: 'Quarantine Role', value: settings.quarantineRoleId ? `<@&${settings.quarantineRoleId}>` : 'Not set' },
      { name: 'Backup Quarantine Role', value: settings.backupQuarantineRoleId ? `<@&${settings.backupQuarantineRoleId}>` : 'Not set' },
    )
    .setFooter({ text: `Requested By | ${requestedBy}` });
}

function panelRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_antinuke_toggle').setLabel('Antinuke').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('panel_antinuke_trustedowner').setLabel('Trusted Owner').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_antinuke_punishment').setLabel('Punishment').setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_antinuke_logchannel').setLabel('Set Log Channel').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('panel_antinuke_quarantine').setLabel('Quarantine Role').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('panel_antinuke_close').setLabel('Close').setStyle(ButtonStyle.Danger),
  );
  return [row1, row2];
}

module.exports = {
  panelEmbed,
  panelRows,

  data: new SlashCommandBuilder().setName('antinuke-panel').setDescription('Open an interactive Antinuke control panel').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const settings = getAntinuke(interaction.guild.id);
    await interaction.reply({ embeds: [panelEmbed(settings, interaction.user.username)], components: panelRows() });
  },
};
