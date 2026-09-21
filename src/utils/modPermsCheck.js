const { PermissionFlagsBits } = require('discord.js');
const { getConfig } = require('./guildConfig');

function getModPerms(guildId) {
  const { modPerms } = getConfig(guildId);
  return modPerms || { roles: {}, muteRoleId: null, banKickLimit: null };
}

// Fallback native Discord permission for each flagged command — holding this
// permission natively always works, same as before /modperms existed.
// /modperms is purely additive: it lets you grant specific roles access
// WITHOUT giving them the native permission.
const NATIVE_FALLBACK = {
  kick: PermissionFlagsBits.KickMembers,
  ban: PermissionFlagsBits.BanMembers,
  unban: PermissionFlagsBits.BanMembers,
  unbanall: PermissionFlagsBits.BanMembers,
  hackban: PermissionFlagsBits.BanMembers,
  timeout: PermissionFlagsBits.ModerateMembers,
  warn: PermissionFlagsBits.ModerateMembers,
  purge: PermissionFlagsBits.ManageMessages,
  role: PermissionFlagsBits.ManageRoles,
  slowmode: PermissionFlagsBits.ManageChannels,
  lock: PermissionFlagsBits.ManageChannels,
  hide: PermissionFlagsBits.ManageChannels,
  hideall: PermissionFlagsBits.ManageChannels,
  unhide: PermissionFlagsBits.ManageChannels,
  unhideall: PermissionFlagsBits.ManageChannels,
  nuke: PermissionFlagsBits.ManageChannels,
};

/**
 * A member can run a flagged moderation command if they're the owner, an
 * Administrator, hold the command's native Discord permission, OR one of
 * their roles has been explicitly granted that command through /modperms.
 */
function canRunModCommand(member, commandName) {
  if (member.guild.ownerId === member.id) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  const nativePerm = NATIVE_FALLBACK[commandName];
  if (nativePerm && member.permissions.has(nativePerm)) return true;

  const { roles } = getModPerms(member.guild.id);
  for (const [roleId, cmds] of Object.entries(roles || {})) {
    if (member.roles.cache.has(roleId) && cmds.includes(commandName)) return true;
  }
  return false;
}

/** Every command name that can be granted via /modperms. Keep in sync with the flagged command files. */
const MODERATION_COMMANDS = ['kick', 'ban', 'unban', 'unbanall', 'hackban', 'timeout', 'warn', 'purge', 'role', 'slowmode', 'lock', 'hide', 'hideall', 'unhide', 'unhideall', 'nuke'];

// ---- Ban/Kick rate limiting (in-memory, resets on restart) ----
const actionHistory = new Map(); // key: `${guildId}:${userId}` -> timestamps[]

function checkAndRecordLimit(guildId, userId, limit) {
  if (!limit) return true;
  const key = `${guildId}:${userId}`;
  const now = Date.now();
  const windowMs = limit.hours * 3600000;
  const history = (actionHistory.get(key) || []).filter((t) => now - t < windowMs);
  if (history.length >= limit.count) return false;
  history.push(now);
  actionHistory.set(key, history);
  return true;
}

module.exports = { getModPerms, canRunModCommand, MODERATION_COMMANDS, checkAndRecordLimit };
