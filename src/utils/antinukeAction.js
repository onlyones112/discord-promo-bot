const { logAction } = require('./logger');

/**
 * Applies the configured Antinuke consequence to an offending member:
 * quarantine (strip roles + cage with a containment role) if one is set,
 * otherwise fall back to the configured punishment (ban/kick/timeout).
 */
async function applyAntinukePunishment(guild, settings, member, reasonSuffix) {
  const reason = `Antinuke: ${reasonSuffix}`;

  const quarantineRoleId = settings.quarantineRoleId || settings.backupQuarantineRoleId;
  if (quarantineRoleId) {
    const role = guild.roles.cache.get(quarantineRoleId);
    if (role) {
      try {
        const keep = member.roles.cache.filter((r) => r.id === guild.id); // keep @everyone only
        await member.roles.set([...keep.keys(), role.id], reason);
        return `Quarantined with ${role}`;
      } catch (err) {
        console.error('Antinuke quarantine failed, falling back to punishment:', err);
      }
    }
  }

  try {
    if (settings.punishment === 'kick' && member.kickable) {
      await member.kick(reason);
      return 'Kicked';
    }
    if (settings.punishment === 'timeout' && member.moderatable) {
      await member.timeout(24 * 60 * 60 * 1000, reason);
      return 'Timed out for 24h';
    }
    if (member.bannable) {
      await member.ban({ reason });
      return 'Banned';
    }
  } catch (err) {
    console.error('Antinuke punishment failed:', err);
  }

  return 'Could not action (missing permissions)';
}

async function logAntinuke(guild, settings, fields) {
  // logChannelId on the antinuke config overrides the generic 'antinuke' log type.
  if (settings.logChannelId) {
    try {
      const channel = await guild.channels.fetch(settings.logChannelId);
      const { EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder().setColor('#ED4245').setTitle('🛡️ Antinuke Triggered').addFields(fields).setTimestamp();
      await channel.send({ embeds: [embed] });
      return;
    } catch {
      // fall through to generic logging
    }
  }
  await logAction(guild, { type: 'antinuke', title: '🛡️ Antinuke Triggered', color: '#ED4245', fields });
}

module.exports = { applyAntinukePunishment, logAntinuke };
