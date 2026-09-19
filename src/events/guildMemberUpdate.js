const { logAction } = require('../utils/logger');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const added = newRoles.filter((r) => !oldRoles.has(r.id));
    const removed = oldRoles.filter((r) => !newRoles.has(r.id));

    if (added.size === 0 && removed.size === 0) return;

    const fields = [{ name: 'User', value: `${newMember.user.tag} (${newMember.id})` }];
    if (added.size) fields.push({ name: 'Roles Added', value: added.map((r) => `${r}`).join(' ') });
    if (removed.size) fields.push({ name: 'Roles Removed', value: removed.map((r) => `${r}`).join(' ') });

    await logAction(newMember.guild, {
      type: 'roles',
      title: '🎭 Roles Updated',
      color: '#5865F2',
      fields,
    });
  },
};
