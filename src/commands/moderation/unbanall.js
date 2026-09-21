const { SlashCommandBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger');

module.exports = {
  moderationCommand: true,
  data: new SlashCommandBuilder().setName('unbanall').setDescription('Unban EVERY currently banned user (use with care)'),

  async execute(interaction) {
    await interaction.deferReply();
    const bans = await interaction.guild.bans.fetch();

    if (bans.size === 0) return interaction.editReply('No one is banned.');

    let count = 0;
    for (const ban of bans.values()) {
      await interaction.guild.members.unban(ban.user.id).catch(() => {});
      count++;
    }

    await interaction.editReply(`Unbanned ${count} user(s).`);
    await logAction(interaction.guild, { type: 'mod', title: 'Mass Unban', fields: [{ name: 'Moderator', value: `${interaction.user.tag}` }, { name: 'Count', value: `${count}` }] });
  },
};
