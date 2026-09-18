const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Show a user's avatar")
    .addUserOption((opt) => opt.setName('user').setDescription('User to look up').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${user.tag}'s avatar`)
      .setImage(user.displayAvatarURL({ size: 1024 }));

    await interaction.reply({ embeds: [embed] });
  },
};
