const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig, getConfig } = require('../utils/guildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-config')
    .setDescription('Configure where closed tickets go')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('set-closed-category')
        .setDescription('Closed tickets get moved here instead of deleted')
        .addChannelOption((opt) => opt.setName('category').setDescription('Category to move closed tickets into').addChannelTypes(ChannelType.GuildCategory).setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('view').setDescription('Show current ticket settings')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set-closed-category') {
      const category = interaction.options.getChannel('category');
      setConfig(interaction.guild.id, { closedCategoryId: category.id });
      return interaction.reply(`Closed tickets will now be moved to **${category.name}** instead of being deleted.`);
    }

    if (sub === 'view') {
      const { closedCategoryId } = getConfig(interaction.guild.id);
      if (!closedCategoryId) {
        return interaction.reply({ content: 'No closed-ticket category set — closed tickets are deleted after 5 seconds. Use `/ticket-config set-closed-category`.', ephemeral: true });
      }
      return interaction.reply({ content: `Closed tickets move to <#${closedCategoryId}>.`, ephemeral: true });
    }
  },
};
