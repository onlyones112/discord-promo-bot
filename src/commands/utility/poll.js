const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a reaction poll')
    .addStringOption((opt) => opt.setName('question').setDescription('The question').setRequired(true))
    .addStringOption((opt) => opt.setName('options').setDescription('Options separated by | (2-10). Leave empty for a yes/no poll').setRequired(false)),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const rawOptions = interaction.options.getString('options');

    let options = [];
    let emojis = [];

    if (rawOptions) {
      options = rawOptions.split('|').map((o) => o.trim()).filter(Boolean).slice(0, 10);
      if (options.length < 2) {
        return interaction.reply({ content: 'Give at least 2 options separated by `|`.', ephemeral: true });
      }
      emojis = NUMBER_EMOJIS.slice(0, options.length);
    } else {
      options = ['Yes', 'No'];
      emojis = ['👍', '👎'];
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(question)
      .setDescription(options.map((o, i) => `${emojis[i]} ${o}`).join('\n'))
      .setFooter({ text: `Poll by ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });
    const msg = await interaction.fetchReply();
    for (const emoji of emojis) {
      await msg.react(emoji);
    }
  },
};
