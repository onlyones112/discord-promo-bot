const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getModPermsFull } = require('./modperms');

function panelEmbed(guildId, requestedBy) {
  const current = getModPermsFull(guildId);
  const roleEntries = Object.entries(current.roles).filter(([, cmds]) => cmds.length > 0);

  const embed = new EmbedBuilder()
    .setColor('#2F80ED')
    .setTitle('🔨 Moderation Permissions Setup')
    .setDescription('Configure per-role moderation permissions, mute role, and action limits.')
    .setFooter({ text: `Requested By | ${requestedBy}` });

  if (roleEntries.length) {
    embed.addFields({
      name: 'Configured Roles',
      value: roleEntries.map(([roleId, cmds]) => `<@&${roleId}> — ${cmds.length} cmd(s)`).join('\n'),
    });
  } else {
    embed.addFields({ name: 'Configured Roles', value: 'None yet — use `/modperms grant`' });
  }

  embed.addFields(
    { name: 'Chat Mute Role', value: current.muteRoleId ? `<@&${current.muteRoleId}>` : 'Not set', inline: true },
    { name: 'Ban/Kick Limit', value: current.banKickLimit ? `${current.banKickLimit.count} / ${current.banKickLimit.hours}h` : 'Not set', inline: true },
  );

  return embed;
}

function panelRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_modperms_role').setLabel('Set Chat Mute Role').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('panel_modperms_limit').setLabel('Ban/Kick Limit').setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_modperms_reset').setLabel('Reset All').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('panel_modperms_close').setLabel('Close').setStyle(ButtonStyle.Danger),
  );
  return [row1, row2];
}

module.exports = {
  panelEmbed,
  panelRows,

  data: new SlashCommandBuilder().setName('modperms-panel').setDescription('Open the interactive Moderation Permissions panel').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.reply({
      embeds: [panelEmbed(interaction.guild.id, interaction.user.username)],
      components: panelRows(),
      content: 'For granting specific commands to a role, use `/modperms grant role:@Role command:<name>` — a full per-command picker is on the roadmap for this panel.',
    });
  },
};
