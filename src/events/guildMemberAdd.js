const { EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');
const { getConfig } = require('../utils/guildConfig');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const accountAge = Date.now() - member.user.createdTimestamp;
    const isNew = accountAge < 7 * 24 * 60 * 60 * 1000;

    await logAction(member.guild, {
      type: 'joinleave',
      title: '📥 Member Joined',
      color: '#57F287',
      fields: [
        { name: 'User', value: `${member.user.tag} (${member.id})` },
        { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>${isNew ? ' ⚠️ new account' : ''}` },
        { name: 'Member Count', value: `${member.guild.memberCount}` },
      ],
    });

    const { autoRoleId } = getConfig(member.guild.id);
    if (autoRoleId) {
      const role = member.guild.roles.cache.get(autoRoleId);
      if (role) await member.roles.add(role).catch(() => {});
    }
  },
};
