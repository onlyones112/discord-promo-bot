const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post a formatted announcement embed to a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption((opt) => opt.setName('channel').setDescription('Channel to post in').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addStringOption((opt) => opt.setName('message').setDescription('Announcement text').setRequired(true))
    .addStringOption((opt) => opt.setName('title').setDescription('Title').setRequired(false))
    .addBooleanOption((opt) => opt.setName('ping_everyone').setDescription('Ping @everyone with it').setRequired(false)),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');
    const title = interaction.options.getString('title') || '📢 Announcement';
    const ping = interaction.options.getBoolean('ping_everyone') || false;

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(title)
      .setDescription(message)
      .setFooter({ text: `Posted by ${interaction.user.tag}` })
      .setTimestamp();

    await channel.send({ content: ping ? '@everyone' : undefined, embeds: [embed] });
    await interaction.reply({ content: `Announcement posted in ${channel}.`, ephemeral: true });
  },
};
