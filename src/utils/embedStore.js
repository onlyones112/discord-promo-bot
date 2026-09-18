const { EmbedBuilder } = require('discord.js');

// In-memory per-user embed drafts. Fine for a single-process bot;
// swap for a DB/JSON file if you need drafts to survive restarts.
const drafts = new Map();

function blankDraft() {
  return {
    title: null,
    description: null,
    color: '#5865F2',
    author: null,
    authorIcon: null,
    footer: null,
    footerIcon: null,
    image: null,
    thumbnail: null,
    fields: [], // { name, value, inline }
    editTarget: null, // { channelId, messageId } when editing an existing sent embed
  };
}

function getDraft(userId) {
  if (!drafts.has(userId)) drafts.set(userId, blankDraft());
  return drafts.get(userId);
}

function resetDraft(userId) {
  drafts.set(userId, blankDraft());
  return drafts.get(userId);
}

function buildEmbed(draft) {
  const embed = new EmbedBuilder().setColor(draft.color || '#5865F2');
  if (draft.title) embed.setTitle(draft.title);
  if (draft.description) embed.setDescription(draft.description);
  if (draft.author) embed.setAuthor({ name: draft.author, iconURL: draft.authorIcon || undefined });
  if (draft.footer) embed.setFooter({ text: draft.footer, iconURL: draft.footerIcon || undefined });
  if (draft.image) embed.setImage(draft.image);
  if (draft.thumbnail) embed.setThumbnail(draft.thumbnail);
  if (draft.fields.length) embed.addFields(draft.fields);
  if (!draft.title && !draft.description && draft.fields.length === 0) {
    embed.setDescription('*(empty — use the buttons below to add content)*');
  }
  return embed;
}

module.exports = { getDraft, resetDraft, buildEmbed, drafts };
