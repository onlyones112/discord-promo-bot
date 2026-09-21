const { SlashCommandBuilder } = require('discord.js');
const { getJoinInfo } = require('../../utils/inviteStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inviter')
    .setDescription('Show who invited a member')
    .addUserOption((opt) => opt.setName('user').setDescription('User to check (defaults to you)').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const info = getJoinInfo(interaction.guild.id, user.id);

    if (!info || !info.inviterId) {
      return interaction.reply({ content: `No invite record for ${user.tag} (they may have joined before invite tracking started, or via a link Discord doesn't attribute).`, ephemeral: true });
    }

    await interaction.reply(`${user.tag} was invited by <@${info.inviterId}> using code \`${info.code}\`.`);
  },
};
