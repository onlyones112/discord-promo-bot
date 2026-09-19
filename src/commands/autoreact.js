const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getConfig, setConfig } = require('../utils/guildConfig');

function getAutoReacts(guildId) {
  return getConfig(guildId).autoReact || [];
}

module.exports = {
  getAutoReacts,

  data: new SlashCommandBuilder()
    .setName('autoreact')
    .setDescription('Make the bot automatically react to every message in a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add an auto-react')
        .addChannelOption((opt) => opt.setName('channel').setDescription('Channel to auto-react in').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption((opt) => opt.setName('emoji').setDescription('Emoji to react with').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove an auto-react')
        .addChannelOption((opt) => opt.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption((opt) => opt.setName('emoji').setDescription('The emoji to remove').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List all auto-reacts')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const current = getAutoReacts(interaction.guild.id);

    if (sub === 'add') {
      const channel = interaction.options.getChannel('channel');
      const emoji = interaction.options.getString('emoji');
      const updated = [...current, { channelId: channel.id, emoji }];
      setConfig(interaction.guild.id, { autoReact: updated });
      return interaction.reply(`I'll now react with ${emoji} to every message in ${channel}.`);
    }

    if (sub === 'remove') {
      const channel = interaction.options.getChannel('channel');
      const emoji = interaction.options.getString('emoji');
      const updated = current.filter((a) => !(a.channelId === channel.id && a.emoji === emoji));
      setConfig(interaction.guild.id, { autoReact: updated });
      return interaction.reply(`Removed that auto-react from ${channel}.`);
    }

    if (sub === 'list') {
      if (current.length === 0) return interaction.reply({ content: 'No auto-reacts configured.', ephemeral: true });
      const lines = current.map((a) => `<#${a.channelId}> → ${a.emoji}`);
      return interaction.reply({ content: lines.join('\n'), ephemeral: true });
    }
  },
};
