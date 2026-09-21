const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getAutomod } = require('./automod');
const { setConfig } = require('../utils/guildConfig');

const FILTERS = [
  { key: 'invites', label: 'Invites' },
  { key: 'links', label: 'Links' },
  { key: 'mentions', label: 'Mention Spam' },
  { key: 'images', label: 'Images' },
];

function panelEmbed(settings) {
  const lines = FILTERS.map((f) => `${settings[f.key] ? '✅' : '❌'} ${f.label}`).join('\n');
  return new EmbedBuilder()
    .setColor('#2F80ED')
    .setTitle('🧠 AutoMod Panel')
    .setDescription(`${lines}\n\nClick a button below to toggle that filter. Staff with Manage Messages are always exempt.`)
    .setFooter({ text: 'Only Manage Guild permission holders can use these buttons' });
}

function panelRow(settings) {
  const row = new ActionRowBuilder();
  for (const f of FILTERS) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`panel_automod_toggle:${f.key}`)
        .setLabel(`${settings[f.key] ? 'Disable' : 'Enable'} ${f.label}`)
        .setStyle(settings[f.key] ? ButtonStyle.Danger : ButtonStyle.Success),
    );
  }
  return row;
}

module.exports = {
  panelEmbed,
  panelRow,

  data: new SlashCommandBuilder().setName('automod-panel').setDescription('Open an interactive AutoMod control panel').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const settings = getAutomod(interaction.guild.id);
    await interaction.reply({ embeds: [panelEmbed(settings)], components: [panelRow(settings)] });
  },
};
