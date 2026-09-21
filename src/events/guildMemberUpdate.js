const { AuditLogEvent } = require('discord.js');
const { logAction } = require('../utils/logger');
const { getRoleLock } = require('../commands/rolelock');

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

    // ---- RoleLock enforcement ----
    const roleLock = getRoleLock(newMember.guild.id);
    if (!roleLock.enabled || roleLock.lockedRoles.length === 0) return;

    const touchedLocked = [...added.values(), ...removed.values()].filter((r) => roleLock.lockedRoles.includes(r.id));
    if (touchedLocked.length === 0) return;

    let executorId = null;
    try {
      const logs = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 1 });
      const entry = logs.entries.first();
      if (entry && Date.now() - entry.createdTimestamp < 5000 && entry.target.id === newMember.id) executorId = entry.executor.id;
    } catch {
      return;
    }

    if (!executorId) return;
    if (executorId === newMember.guild.client.user.id) return; // the bot itself is always allowed
    if (executorId === newMember.guild.ownerId) return;
    if (roleLock.trusted.includes(executorId)) return;

    // Not trusted — revert the change on every protected role that was touched.
    try {
      for (const role of touchedLocked) {
        if (added.has(role.id)) await newMember.roles.remove(role, 'RoleLock: unauthorized role grant reverted');
        else await newMember.roles.add(role, 'RoleLock: unauthorized role removal reverted');
      }

      await logAction(newMember.guild, {
        type: 'roles',
        title: '🔒 RoleLock Reverted a Change',
        color: '#ED4245',
        fields: [
          { name: 'Target', value: `${newMember.user.tag}` },
          { name: 'Executor', value: `<@${executorId}> (not trusted)` },
          { name: 'Protected Roles Touched', value: touchedLocked.map((r) => `${r}`).join(' ') },
        ],
      });
    } catch (err) {
      console.error('RoleLock revert failed:', err);
    }
  },
};
