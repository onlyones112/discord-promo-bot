const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getConfig, setConfig } = require('../utils/guildConfig');
const { buildPanelEmbed } = require('../utils/panelStyle');

const MAX_USERS = 10;

function getNoPrefixUsers(guildId) {
  return getConfig(guildId).noPrefixUsers || [];
}

function panelEmbed(guildId, requestedBy) {
  const users = getNoPrefixUsers(guildId);
  return buildPanelEmbed({
    moduleKey: 'noprefix',
    moduleLabel: 'No-Prefix',
    tagline: 'These users can bare-type safe commands and config panels with zero prefix.',
    statusLines: [`users ........... ${users.length}/${MAX_USERS}`],
    note: users.length ? users.map((id) => `<@${id}>`).join(', ') : undefined,
    requestedBy,
  });
}

function panelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel_noprefix_add').setLabel('Add').setEmoji('➕').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_noprefix_remove').setLabel('Remove').setEmoji('➖').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel_noprefix_close').setLabel('Dismiss').setEmoji('✕').setStyle(ButtonStyle.Secondary),
  );
}

module.exports = {
  MAX_USERS,
  getNoPrefixUsers,
  panelEmbed,
  panelRow,

  data: new SlashCommandBuilder()
    .setName('guildnoprefix')
    .setDescription('Opens the no-prefix user panel — or pass action+user to skip straight to add/remove/list')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) =>
      opt
        .setName('action')
        .setDescription('Leave empty to just open the panel')
        .setRequired(false)
        .addChoices({ name: 'Add user', value: 'add' }, { name: 'Remove user', value: 'remove' }, { name: 'List users', value: 'list' }),
    )
    .addUserOption((opt) => opt.setName('user').setDescription('Required for add/remove').setRequired(false)),

  async execute(interaction) {
    const action = interaction.options.getString('action');

    // Bare "/guildnoprefix" with no options — open the panel directly.
    if (!action) {
      return interaction.reply({ embeds: [panelEmbed(interaction.guild.id, interaction.user.username)], components: [panelRow()] });
    }

    const current = getNoPrefixUsers(interaction.guild.id);

    if (action === 'add') {
      const user = interaction.options.getUser('user');
      if (!user) return interaction.reply({ content: 'Pass a `user` to add.', ephemeral: true });
      if (current.includes(user.id)) return interaction.reply({ content: `${user.tag} is already on the list.`, ephemeral: true });
      if (current.length >= MAX_USERS) return interaction.reply({ content: `Limit reached (${MAX_USERS}). Remove someone first.`, ephemeral: true });
      setConfig(interaction.guild.id, { noPrefixUsers: [...current, user.id] });
      return interaction.reply(`${user.tag} can now use safe commands with zero prefix (${current.length + 1}/${MAX_USERS}).`);
    }

    if (action === 'remove') {
      const user = interaction.options.getUser('user');
      if (!user) return interaction.reply({ content: 'Pass a `user` to remove.', ephemeral: true });
      setConfig(interaction.guild.id, { noPrefixUsers: current.filter((id) => id !== user.id) });
      return interaction.reply(`${user.tag} removed from the no-prefix list.`);
    }

    if (action === 'list') {
      if (current.length === 0) return interaction.reply({ content: 'No users configured.', ephemeral: true });
      return interaction.reply({ content: `${current.length}/${MAX_USERS}: ${current.map((id) => `<@${id}>`).join(', ')}`, ephemeral: true });
    }
  },
};
