const { getCached, setCached } = require('../utils/inviteCache');

module.exports = {
  name: 'inviteCreate',
  execute(invite) {
    const map = getCached(invite.guild.id);
    map.set(invite.code, { uses: invite.uses || 0, inviterId: invite.inviter?.id || null });
    setCached(invite.guild.id, map);
  },
};
