const { getMappings } = require('../utils/reactionRoleStore');

function emojiKey(emoji) {
  // Custom emojis match by ID, unicode emojis match by name (the character itself).
  return emoji.id || emoji.name;
}

function storedKeyMatches(stored, key) {
  const customMatch = stored.match(/^<a?:\w+:(\d+)>$/);
  if (customMatch) return customMatch[1] === key;
  return stored === key;
}

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch {
        return;
      }
    }

    const mappings = getMappings(reaction.message.id);
    if (mappings.length === 0) return;

    const key = emojiKey(reaction.emoji);
    const match = mappings.find((m) => storedKeyMatches(m.emoji, key));
    if (!match) return;

    try {
      const guild = reaction.message.guild;
      const member = await guild.members.fetch(user.id);
      await member.roles.add(match.roleId);
    } catch (err) {
      console.error('Reaction role add failed:', err);
    }
  },
};
