const { getCached, setCached } = require('../utils/inviteCache');

module.exports = {
  name: 'inviteDelete',
  execute(invite) {
    const map = getCached(invite.guild.id);
    map.delete(invite.code);
    setCached(invite.guild.id, map);
  },
};
