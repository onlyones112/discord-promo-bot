const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('serverstats').setDescription('Detailed server statistics'),

  async execute(interaction) {
    await interaction.deferReply();
    const guild = interaction.guild;
    const members = await guild.members.fetch();

    const humans = members.filter((m) => !m.user.bot).size;
    const bots = members.filter((m) => m.user.bot).size;
    const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;

    const embed = new EmbedBuilder()
      .setColor('#2F80ED')
      .setTitle(`📊 ${guild.name} — Server Stats`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: 'Members', value: `${guild.memberCount}`, inline: true },
        { name: 'Humans', value: `${humans}`, inline: true },
        { name: 'Bots', value: `${bots}`, inline: true },
        { name: 'Text Channels', value: `${textChannels}`, inline: true },
        { name: 'Voice Channels', value: `${voiceChannels}`, inline: true },
        { name: 'Categories', value: `${categories}`, inline: true },
        { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
        { name: 'Boost Level', value: `${guild.premiumTier}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>` },
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
