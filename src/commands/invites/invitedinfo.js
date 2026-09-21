const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getJoinInfo } = require('../../utils/inviteStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invitedinfo')
    .setDescription('Detailed invite record for a member')
    .addUserOption((opt) => opt.setName('user').setDescription('User to check (defaults to you)').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const info = getJoinInfo(interaction.guild.id, user.id);

    if (!info) {
      return interaction.reply({ content: `No invite record for ${user.tag}.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#2F80ED')
      .setTitle(`Invite Record — ${user.tag}`)
      .addFields(
        { name: 'Invited By', value: info.inviterId ? `<@${info.inviterId}>` : 'Unknown' },
        { name: 'Invite Code', value: `\`${info.code || 'unknown'}\`` },
        { name: 'Joined', value: `<t:${Math.floor(info.joinedAt / 1000)}:F>` },
        { name: 'Flagged As Fake', value: info.fake ? 'Yes (new account at time of join)' : 'No' },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
