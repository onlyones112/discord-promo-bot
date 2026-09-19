const { PermissionFlagsBits } = require('discord.js');
const { getAutomod } = require('../commands/automod');
const { logAction } = require('../utils/logger');

const INVITE_REGEX = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/\S+/i;
const LINK_REGEX = /https?:\/\/\S+/i;
const MENTION_SPAM_THRESHOLD = 5;

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;
    if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return; // staff bypass

    const settings = getAutomod(message.guild.id);
    let violation = null;

    if (settings.invites && INVITE_REGEX.test(message.content)) violation = 'Discord invite link';
    else if (settings.links && LINK_REGEX.test(message.content)) violation = 'Link/URL';
    else if (settings.mentions && message.mentions.users.size + message.mentions.roles.size >= MENTION_SPAM_THRESHOLD) violation = 'Mass mention spam';
    else if (settings.images && message.attachments.size > 0) violation = 'Image/attachment';

    if (!violation) return;

    await message.delete().catch(() => {});
    await message.channel
      .send({ content: `${message.author}, that message was removed (${violation} not allowed here).` })
      .then((m) => setTimeout(() => m.delete().catch(() => {}), 6000));

    await logAction(message.guild, {
      title: 'AutoMod Removed a Message',
      color: '#FEE75C',
      fields: [
        { name: 'User', value: `${message.author.tag}`, inline: true },
        { name: 'Channel', value: `${message.channel}`, inline: true },
        { name: 'Reason', value: violation },
      ],
    });
  },
};
