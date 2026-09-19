const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig } = require('../utils/guildConfig');

const DEFAULTS = { invites: false, links: false, mentions: false, images: false };

function getAutomod(guildId) {
  const { automod } = getConfig(guildId);
  return { ...DEFAULTS, ...(automod || {}) };
}

module.exports = {
  getAutomod,

  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure automatic message filtering')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('toggle')
        .setDescription('Turn a filter on or off')
        .addStringOption((opt) =>
          opt
            .setName('filter')
            .setDescription('Which filter')
            .setRequired(true)
            .addChoices(
              { name: 'Discord invite links', value: 'invites' },
              { name: 'All links/URLs', value: 'links' },
              { name: 'Mass mention spam (5+ mentions)', value: 'mentions' },
              { name: 'Images/attachments', value: 'images' },
            ),
        )
        .addStringOption((opt) => opt.setName('state').setDescription('on or off').setRequired(true).addChoices({ name: 'On', value: 'on' }, { name: 'Off', value: 'off' })),
    )
    .addSubcommand((sub) => sub.setName('view').setDescription('Show current AutoMod settings')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const current = getAutomod(interaction.guild.id);

    if (sub === 'toggle') {
      const filter = interaction.options.getString('filter');
      const state = interaction.options.getString('state') === 'on';
      const updated = { ...current, [filter]: state };
      setConfig(interaction.guild.id, { automod: updated });
      return interaction.reply(`**${filter}** filter is now **${state ? 'ON' : 'OFF'}**.`);
    }

    if (sub === 'view') {
      const lines = Object.entries(current).map(([k, v]) => `${v ? '✅' : '❌'} ${k}`);
      return interaction.reply({ content: `**AutoMod settings:**\n${lines.join('\n')}\n\nStaff with Manage Messages permission are never filtered.`, ephemeral: true });
    }
  },
};
