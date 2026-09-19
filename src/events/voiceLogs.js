const { logAction } = require('../utils/logger');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member) return;

    if (!oldState.channelId && newState.channelId) {
      await logAction(newState.guild, {
        type: 'voice',
        title: '🔊 Joined Voice',
        color: '#57F287',
        fields: [
          { name: 'User', value: `${member.user.tag}` },
          { name: 'Channel', value: `${newState.channel}` },
        ],
      });
    } else if (oldState.channelId && !newState.channelId) {
      await logAction(oldState.guild, {
        type: 'voice',
        title: '🔇 Left Voice',
        color: '#ED4245',
        fields: [
          { name: 'User', value: `${member.user.tag}` },
          { name: 'Channel', value: `${oldState.channel?.name || 'unknown'}` },
        ],
      });
    } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      await logAction(newState.guild, {
        type: 'voice',
        title: '🔀 Switched Voice Channel',
        color: '#5865F2',
        fields: [
          { name: 'User', value: `${member.user.tag}` },
          { name: 'From', value: `${oldState.channel?.name || 'unknown'}` },
          { name: 'To', value: `${newState.channel}` },
        ],
      });
    }
  },
};
