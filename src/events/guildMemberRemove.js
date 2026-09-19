const { logAction } = require('../utils/logger');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    await logAction(member.guild, {
      type: 'joinleave',
      title: '📤 Member Left',
      color: '#ED4245',
      fields: [
        { name: 'User', value: `${member.user.tag} (${member.id})` },
        { name: 'Joined', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown' },
        { name: 'Member Count', value: `${member.guild.memberCount}` },
      ],
    });
  },
};
