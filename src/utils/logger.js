const { EmbedBuilder } = require('discord.js');
const { getConfig } = require('./guildConfig');

const TYPES = ['general', 'mod', 'joinleave', 'roles', 'voice', 'tickets', 'antinuke'];

/**
 * Sends a log embed to the guild's configured log channel for this type.
 * Falls back to the "general" log channel if a specific type isn't set,
 * and is a safe no-op if nothing is configured at all.
 */
async function logAction(guild, { type = 'general', title, color = '#5865F2', fields = [], description }) {
  const { logs } = getConfig(guild.id);
  if (!logs) return;

  const channelId = logs[type] || logs.general;
  if (!channelId) return;

  try {
    const channel = await guild.channels.fetch(channelId);
    if (!channel) return;

    const embed = new EmbedBuilder().setColor(color).setTitle(title).setTimestamp();
    if (description) embed.setDescription(description);
    if (fields.length) embed.addFields(fields);

    await channel.send({ embeds: [embed] });
  } catch {
    // log channel missing/no perms — don't let logging break the actual command
  }
}

module.exports = { logAction, TYPES };
