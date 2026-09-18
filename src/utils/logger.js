const { EmbedBuilder } = require('discord.js');
const { getConfig } = require('./guildConfig');

/**
 * Sends a log embed to the guild's configured log channel, if one is set.
 * Safe to call even if no log channel is configured (no-op) or the channel
 * was deleted (fails silently).
 */
async function logAction(guild, { title, color = '#5865F2', fields = [], description }) {
  const { logChannelId } = getConfig(guild.id);
  if (!logChannelId) return;

  try {
    const channel = await guild.channels.fetch(logChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setTimestamp();

    if (description) embed.setDescription(description);
    if (fields.length) embed.addFields(fields);

    await channel.send({ embeds: [embed] });
  } catch {
    // log channel missing/no perms — don't let logging break the actual command
  }
}

module.exports = { logAction };
