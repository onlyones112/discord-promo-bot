const { AuditLogEvent } = require('discord.js');
const { getAntinuke } = require('../commands/antinuke');
const { applyAntinukePunishment, logAntinuke } = require('../utils/antinukeAction');

const recentDeletions = new Map();
const WINDOW_MS = 10000;
const THRESHOLD = 3;

module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    const guild = channel.guild;
    if (!guild) return;

    const settings = getAntinuke(guild.id);
    if (!settings.enabled) return;

    let executorId = null;
    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 });
      const entry = logs.entries.first();
      if (entry && Date.now() - entry.createdTimestamp < 5000) executorId = entry.executor.id;
    } catch {
      return;
    }

    if (!executorId || executorId === guild.client.user.id) return;
    if (settings.trustedOwners.includes(executorId)) return;
    if (executorId === guild.ownerId) return;

    const now = Date.now();
    const history = (recentDeletions.get(executorId) || []).filter((t) => now - t < WINDOW_MS);
    history.push(now);
    recentDeletions.set(executorId, history);

    if (history.length >= THRESHOLD) {
      recentDeletions.delete(executorId);
      const member = await guild.members.fetch(executorId).catch(() => null);
      if (!member) return;

      const result = await applyAntinukePunishment(guild, settings, member, 'mass channel deletion detected');
      await logAntinuke(guild, settings, [
        { name: 'User', value: `${member.user.tag} (${executorId})` },
        { name: 'Trigger', value: `Deleted ${history.length}+ channels in ${WINDOW_MS / 1000}s` },
        { name: 'Action Taken', value: result },
      ]);
    }
  },
};
