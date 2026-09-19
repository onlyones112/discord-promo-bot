const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig } = require('../utils/guildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setprefix')
    .setDescription('Set up a text-command prefix (in addition to slash commands)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Turn on prefix commands with this prefix')
        .addStringOption((opt) => opt.setName('prefix').setDescription('e.g. ! or , or ?').setRequired(true).setMaxLength(5)),
    )
    .addSubcommand((sub) => sub.setName('disable').setDescription('Turn off prefix commands (slash-only mode)'))
    .addSubcommand((sub) => sub.setName('view').setDescription('Show the current prefix')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const prefix = interaction.options.getString('prefix');
      setConfig(interaction.guild.id, { prefix });
      return interaction.reply(`Prefix set to \`${prefix}\`. Try \`${prefix}help\` or \`${prefix}ping\`. Slash commands (\`/\`) still work as normal too.`);
    }

    if (sub === 'disable') {
      setConfig(interaction.guild.id, { prefix: null });
      return interaction.reply('Prefix commands turned off — slash commands (`/`) only now.');
    }

    if (sub === 'view') {
      const { prefix } = getConfig(interaction.guild.id);
      return interaction.reply({ content: prefix ? `Current prefix: \`${prefix}\`` : 'No prefix set — slash-only mode. Use `/setprefix set` to turn on prefix commands.', ephemeral: true });
    }
  },
};
