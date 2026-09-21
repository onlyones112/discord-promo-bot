const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getConfig } = require('../utils/guildConfig');

function panelEmbed(guild, requestedBy) {
  const { logs } = getConfig(guild.id);
  const modLogId = logs?.mod;
  return new EmbedBuilder()
    .setColor('#2F80ED')
    .setTitle('🔨 Configure Moderation')
    .setDescription(`Quick actions for ${guild.name}. For kick/ban/warn/timeout with a target user, use their slash commands directly.`)
    .addFields({ name: 'Mod Log Channel', value: modLogId ? `<#${modLogId}>` : 'Not set' })
    .setFooter({ text: `Requested By | ${requestedBy}` });
}

function panelRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_mod_lock').setLabel('Lock Channel').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('panel_mod_unlock').setLabel('Unlock Channel').setEmoji('🔓').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('panel_mod_purge10').setLabel('Purge Last 10').setEmoji('🧹').setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_mod_logchannel').setLabel('Set Mod Log Channel').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('panel_mod_close').setLabel('Close').setStyle(ButtonStyle.Danger),
  );
  return [row1, row2];
}

module.exports = {
  panelEmbed,
  panelRows,

  data: new SlashCommandBuilder().setName('moderation-panel').setDescription('Open the interactive Moderation setup/quick-action panel').setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    await interaction.reply({ embeds: [panelEmbed(interaction.guild, interaction.user.username)], components: panelRows() });
  },
};
