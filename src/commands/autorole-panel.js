const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getAutoroles } = require('./autorole');

function panelEmbed(guildId, requestedBy) {
  const current = getAutoroles(guildId);
  return new EmbedBuilder()
    .setColor('#2F80ED')
    .setTitle('👥 Autorole Dashboard')
    .setDescription('Use the buttons below to manage each category.')
    .addFields(
      { name: 'Human Autoroles', value: current.humanRoleIds.length ? current.humanRoleIds.map((id, i) => `${i + 1}. <@&${id}>`).join('\n') : 'None' },
      { name: 'Bot Autoroles', value: current.botRoleIds.length ? current.botRoleIds.map((id, i) => `${i + 1}. <@&${id}>`).join('\n') : 'None' },
    )
    .setFooter({ text: `Requested By | ${requestedBy}` });
}

function panelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_autorole_human').setLabel('Human Autorole').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('panel_autorole_bot').setLabel('Bot Autorole').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('panel_autorole_close').setLabel('Close').setStyle(ButtonStyle.Danger),
  );
}

module.exports = {
  panelEmbed,
  panelRow,

  data: new SlashCommandBuilder().setName('autorole-panel').setDescription('Open the interactive Autorole dashboard').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    await interaction.reply({ embeds: [panelEmbed(interaction.guild.id, interaction.user.username)], components: [panelRow()] });
  },
};
