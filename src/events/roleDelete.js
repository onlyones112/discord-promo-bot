const { AuditLogEvent } = require('discord.js');
const { getAntinuke } = require('../commands/antinuke');
const { logAction } = require('../utils/logger');

const recentDeletions = new Map();
const WINDOW_MS = 10000;
const THRESHOLD = 3;

module.exports = {
  name: 'roleDelete',
  async execute(role) {
    const guild = role.guild;
    const settings = getAntinuke(guild.id);
    if (!settings.enabled) return;

    let executorId = null;
    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 });
      const entry = logs.entries.first();
      if (entry && Date.now() - entry.createdTimestamp < 5000) executorId = entry.executor.id;
    } catch {
      return;
    }

    if (!executorId || executorId === guild.client.user.id) return;
    if (settings.whitelist.includes(executorId)) return;
    if (executorId === guild.ownerId) return;

    const now = Date.now();
    const history = (recentDeletions.get(executorId) || []).filter((t) => now - t < WINDOW_MS);
    history.push(now);
    recentDeletions.set(executorId, history);

    if (history.length >= THRESHOLD) {
      recentDeletions.delete(executorId);
      try {
        const member = await guild.members.fetch(executorId);
        if (member.bannable) {
          await member.ban({ reason: 'Antinuke: mass role deletion detected' });
          await logAction(guild, {
            title: '🛡️ Antinuke Triggered — Role Deletion',
            type: 'antinuke',
            color: '#ED4245',
            fields: [
              { name: 'User', value: `${member.user.tag} (${executorId})` },
              { name: 'Action', value: `Banned for deleting ${history.length}+ roles in ${WINDOW_MS / 1000}s` },
            ],
          });
        }
      } catch (err) {
        console.error('Antinuke ban failed:', err);
      }
    }
  },
};
