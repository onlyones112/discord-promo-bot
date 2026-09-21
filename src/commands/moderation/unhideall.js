const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { logAction } = require('../../utils/logger');

module.exports = {
  moderationCommand: true,
  data: new SlashCommandBuilder().setName('unhideall').setDescription('Unhide every text channel for @everyone'),

  async execute(interaction) {
    await interaction.deferReply();
    const channels = interaction.guild.channels.cache.filter((c) => c.type === ChannelType.GuildText);
    let count = 0;
    for (const channel of channels.values()) {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: null }).catch(() => {});
      count++;
    }
    await interaction.editReply(`👁️ Unhid ${count} channel(s).`);
    await logAction(interaction.guild, { type: 'mod', title: 'All Channels Unhidden', fields: [{ name: 'Moderator', value: `${interaction.user.tag}` }, { name: 'Count', value: `${count}` }] });
  },
};
