const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getRoleLock } = require('./rolelock');

function panelEmbed(settings) {
  return new EmbedBuilder()
    .setColor('#2F80ED')
    .setTitle('🔐 RoleLock Panel')
    .setDescription(
      `**Status:** ${settings.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
        `**Protected roles:** ${settings.lockedRoles.length ? settings.lockedRoles.map((id) => `<@&${id}>`).join(', ') : 'None'}\n` +
        `**Trusted users:** ${settings.trusted.length ? settings.trusted.map((id) => `<@${id}>`).join(', ') : 'None'}\n\n` +
        `Use \`/rolelock add\` and \`/rolelock trusted-add\` to configure which roles are protected and who can manage them.`,
    );
}

function panelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_rolelock_enable').setLabel('Enable').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('panel_rolelock_disable').setLabel('Disable').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('panel_rolelock_refresh').setLabel('Refresh').setStyle(ButtonStyle.Secondary).setEmoji('🔄'),
  );
}

module.exports = {
  panelEmbed,
  panelRow,

  data: new SlashCommandBuilder().setName('rolelock-panel').setDescription('Open an interactive RoleLock control panel').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const settings = getRoleLock(interaction.guild.id);
    await interaction.reply({ embeds: [panelEmbed(settings)], components: [panelRow()] });
  },
};
