const { EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');
const { getConfig, setConfig } = require('../utils/guildConfig');
const { getCached, setCached, cacheGuildInvites } = require('../utils/inviteCache');
const { adjustStats, setJoinInfo } = require('../utils/inviteStore');

async function detectUsedInvite(guild) {
  const before = getCached(guild.id);
  let after;
  try {
    after = await guild.invites.fetch();
  } catch {
    return null;
  }

  let used = null;
  for (const invite of after.values()) {
    const prev = before.get(invite.code);
    const prevUses = prev ? prev.uses : 0;
    if ((invite.uses || 0) > prevUses) {
      used = { code: invite.code, inviterId: invite.inviter?.id || null };
      break;
    }
  }

  const newMap = new Map();
  after.forEach((inv) => newMap.set(inv.code, { uses: inv.uses || 0, inviterId: inv.inviter?.id || null }));
  setCached(guild.id, newMap);

  return used;
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const accountAge = Date.now() - member.user.createdTimestamp;
    const isNew = accountAge < 7 * 24 * 60 * 60 * 1000;

    let inviteInfo = null;
    if (!member.user.bot) {
      const used = await detectUsedInvite(member.guild);
      if (used && used.inviterId) {
        const blacklisted = getConfig(member.guild.id).blacklistedInviteChannels || [];
        // (Channel-based blacklisting applies to /invitetracker announcements; the invite itself still came from somewhere we can't always resolve to a channel, so we just track the stat.)
        const statKey = isNew ? 'fake' : 'regular';
        adjustStats(member.guild.id, used.inviterId, { [statKey]: 1 });
        setJoinInfo(member.guild.id, member.id, { inviterId: used.inviterId, code: used.code, joinedAt: Date.now(), fake: isNew });
        inviteInfo = used;

        const { inviteTrackerChannelId } = getConfig(member.guild.id);
        if (inviteTrackerChannelId && !blacklisted.includes(inviteTrackerChannelId)) {
          try {
            const channel = await member.guild.channels.fetch(inviteTrackerChannelId);
            const { getStats } = require('../utils/inviteStore');
            const stats = getStats(member.guild.id, used.inviterId);
            const total = stats.regular + stats.bonus - stats.left;
            await channel.send(
              `📥 ${member} joined — invited by <@${used.inviterId}> (**${total}** invite${total === 1 ? '' : 's'})${isNew ? ' ⚠️ *new account*' : ''}`,
            );
          } catch {
            // tracker channel missing/no perms — non-fatal
          }
        }
      }
    }

    await logAction(member.guild, {
      type: 'joinleave',
      title: '📥 Member Joined',
      color: '#57F287',
      fields: [
        { name: 'User', value: `${member.user.tag} (${member.id})` },
        { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>${isNew ? ' ⚠️ new account' : ''}` },
        { name: 'Member Count', value: `${member.guild.memberCount}` },
        ...(inviteInfo ? [{ name: 'Invited By', value: `<@${inviteInfo.inviterId}> (code: ${inviteInfo.code})` }] : []),
      ],
    });

    const { autorole } = getConfig(member.guild.id);
    const roleIds = member.user.bot ? autorole?.botRoleIds : autorole?.humanRoleIds;
    if (roleIds?.length) {
      const roles = roleIds.map((id) => member.guild.roles.cache.get(id)).filter(Boolean);
      if (roles.length) await member.roles.add(roles).catch(() => {});
    }
  },
};
