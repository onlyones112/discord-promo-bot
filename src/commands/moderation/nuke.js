const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { logAction } = require('../../utils/logger');

module.exports = {
  moderationCommand: true,
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Instantly wipe all messages in a channel by recreating it')
    .addChannelOption((opt) => opt.setName('channel').setDescription('Channel to nuke (defaults to here)').addChannelTypes(ChannelType.GuildText).setRequired(false)),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    await interaction.reply({ content: '💥 Nuking...', ephemeral: true });

    const position = channel.position;
    const clone = await channel.clone();
    await clone.setPosition(position).catch(() => {});
    await channel.delete().catch(() => {});

    await clone.send('💥 This channel has been nuked.');
    await logAction(interaction.guild, {
      type: 'mod',
      title: 'Channel Nuked',
      fields: [
        { name: 'Channel', value: `#${clone.name}` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
      ],
    });
  },
};
