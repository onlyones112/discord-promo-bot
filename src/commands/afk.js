const { SlashCommandBuilder } = require('discord.js');
const { setAfk } = require('../utils/afkStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Mark yourself as AFK')
    .addStringOption((opt) => opt.setName('reason').setDescription('Why are you AFK?').setRequired(false)),

  async execute(interaction) {
    const reason = interaction.options.getString('reason');
    setAfk(interaction.guild.id, interaction.user.id, reason);
    await interaction.reply(`💤 ${interaction.user} is now AFK${reason ? `: ${reason}` : ''}.`);
  },
};
