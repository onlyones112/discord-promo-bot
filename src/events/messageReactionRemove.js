const { getMappings } = require('../utils/reactionRoleStore');

function emojiKey(emoji) {
  return emoji.id || emoji.name;
}

function storedKeyMatches(stored, key) {
  const customMatch = stored.match(/^<a?:\w+:(\d+)>$/);
  if (customMatch) return customMatch[1] === key;
  return stored === key;
}

module.exports = {
  name: 'messageReactionRemove',
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
      await member.roles.remove(match.roleId);
    } catch (err) {
      console.error('Reaction role remove failed:', err);
    }
  },
};
