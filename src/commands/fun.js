const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Free public API, no key needed. https://waifu.pics
const ACTIONS = {
  hug: { verb: 'hugs', endpoint: 'hug', needsTarget: true, emoji: '🤗' },
  slap: { verb: 'slaps', endpoint: 'slap', needsTarget: true, emoji: '✋' },
  kiss: { verb: 'kisses', endpoint: 'kiss', needsTarget: true, emoji: '😘' },
  pat: { verb: 'pats', endpoint: 'pat', needsTarget: true, emoji: '🤚' },
  cuddle: { verb: 'cuddles', endpoint: 'cuddle', needsTarget: true, emoji: '🥰' },
  poke: { verb: 'pokes', endpoint: 'poke', needsTarget: true, emoji: '👉' },
  highfive: { verb: 'high-fives', endpoint: 'highfive', needsTarget: true, emoji: '🙌' },
  bonk: { verb: 'bonks', endpoint: 'bonk', needsTarget: true, emoji: '🔨' },
  wink: { verb: 'winks at', endpoint: 'wink', needsTarget: true, emoji: '😉' },
  sorry: { verb: 'says sorry to', endpoint: 'cry', needsTarget: true, emoji: '🙏' },
  cry: { verb: 'is crying', endpoint: 'cry', needsTarget: false, emoji: '😢' },
  happy: { verb: 'is happy', endpoint: 'happy', needsTarget: false, emoji: '😄' },
  blush: { verb: 'is blushing (sharam)', endpoint: 'blush', needsTarget: false, emoji: '😳' },
  dance: { verb: 'is dancing', endpoint: 'dance', needsTarget: false, emoji: '💃' },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fun')
    .setDescription('Roleplay/reaction actions — hug, slap, kiss, and more')
    .addStringOption((opt) =>
      opt
        .setName('action')
        .setDescription('What to do')
        .setRequired(true)
        .addChoices(...Object.entries(ACTIONS).map(([value, a]) => ({ name: `${a.emoji} ${value}`, value }))),
    )
    .addUserOption((opt) => opt.setName('user').setDescription('Who to target (required for most actions)').setRequired(false)),

  async execute(interaction) {
    const actionKey = interaction.options.getString('action');
    const target = interaction.options.getUser('user');
    const action = ACTIONS[actionKey];

    if (action.needsTarget && !target) {
      return interaction.reply({ content: `\`/fun action:${actionKey}\` needs a \`user\` to target.`, ephemeral: true });
    }
    if (target && target.id === interaction.user.id) {
      return interaction.reply({ content: "You can't target yourself with that.", ephemeral: true });
    }

    await interaction.deferReply();

    let imageUrl = null;
    try {
      const res = await fetch(`https://api.waifu.pics/sfw/${action.endpoint}`);
      const json = await res.json();
      imageUrl = json.url;
    } catch (err) {
      console.error('waifu.pics fetch failed:', err);
    }

    const text = action.needsTarget ? `${action.emoji} **${interaction.user.username}** ${action.verb} **${target.username}**!` : `${action.emoji} **${interaction.user.username}** ${action.verb}!`;

    const embed = new EmbedBuilder().setColor('#2F80ED').setDescription(text);
    if (imageUrl) embed.setImage(imageUrl);
    else embed.setFooter({ text: 'Image service unavailable right now.' });

    await interaction.editReply({ embeds: [embed] });
  },
};
