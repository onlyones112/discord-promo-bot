const { ChannelType } = require('discord.js');
const { findHub, registerActiveChannel, isActiveChannel, removeActiveChannel } = require('../utils/j2cStore');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const guild = newState.guild || oldState.guild;

    // Member joined a hub channel -> create their temp channel and move them in.
    if (newState.channelId) {
      const hub = findHub(guild.id, newState.channelId);
      if (hub) {
        try {
          const member = newState.member;
          const tempChannel = await guild.channels.create({
            name: `${member.displayName}'s Channel`.slice(0, 90),
            type: ChannelType.GuildVoice,
            parent: hub.categoryId,
            userLimit: hub.userLimit || 0,
            permissionOverwrites: [
              { id: member.id, allow: ['ManageChannels', 'MuteMembers', 'DeafenMembers', 'MoveMembers'] },
            ],
          });
          registerActiveChannel(guild.id, tempChannel.id, member.id);
          await member.voice.setChannel(tempChannel).catch(() => {});
        } catch (err) {
          console.error('J2C create failed:', err);
        }
      }
    }

    // Member left a temp channel -> delete it if now empty.
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      if (isActiveChannel(guild.id, oldState.channelId)) {
        const channel = guild.channels.cache.get(oldState.channelId);
        if (channel && channel.members.size === 0) {
          removeActiveChannel(guild.id, oldState.channelId);
          await channel.delete().catch(() => {});
        }
      }
    }
  },
};
