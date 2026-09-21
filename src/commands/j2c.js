const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { addHub, removeHub, getHubs } = require('../utils/j2cStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('j2c')
    .setDescription('Join-to-Create voice channel setup')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('Create a new Join-to-Create hub')
        .addChannelOption((opt) => opt.setName('category').setDescription('Category the hub and temp channels live in').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName('type')
            .setDescription('Solo = 1 person limit, Duo = 2 person limit, Unlimited = no limit')
            .setRequired(true)
            .addChoices({ name: 'Solo (1 person)', value: 'solo' }, { name: 'Duo (2 people)', value: 'duo' }, { name: 'Unlimited', value: 'unlimited' }),
        )
        .addStringOption((opt) => opt.setName('name').setDescription('Name for the hub channel').setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a Join-to-Create hub')
        .addChannelOption((opt) => opt.setName('hub').setDescription('The hub voice channel to remove').addChannelTypes(ChannelType.GuildVoice).setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List configured hubs')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const limits = { solo: 1, duo: 2, unlimited: 0 };
    const labels = { solo: '➕ Join to Create (Solo)', duo: '➕ Join to Create (Duo)', unlimited: '➕ Join to Create' };

    if (sub === 'setup') {
      const category = interaction.options.getChannel('category');
      const type = interaction.options.getString('type');
      const name = interaction.options.getString('name') || labels[type];

      const hubChannel = await interaction.guild.channels.create({
        name,
        type: ChannelType.GuildVoice,
        parent: category.id,
      });

      addHub(interaction.guild.id, { hubChannelId: hubChannel.id, categoryId: category.id, type, userLimit: limits[type] });

      await interaction.reply(`Created hub ${hubChannel} — joining it will create a **${type}** voice channel (limit: ${limits[type] || 'none'}) for whoever joins.`);
    }

    if (sub === 'remove') {
      const hub = interaction.options.getChannel('hub');
      removeHub(interaction.guild.id, hub.id);
      await interaction.reply(`Removed ${hub} as a Join-to-Create hub. (The channel itself was not deleted — remove it manually if you want.)`);
    }

    if (sub === 'list') {
      const hubs = getHubs(interaction.guild.id);
      if (hubs.length === 0) return interaction.reply({ content: 'No Join-to-Create hubs configured yet.', ephemeral: true });
      const lines = hubs.map((h) => `<#${h.hubChannelId}> — type: **${h.type}**`);
      await interaction.reply({ content: lines.join('\n'), ephemeral: true });
    }
  },
};
