const { SlashCommandBuilder } = require('discord.js');

function parseDuration(text) {
  const match = text.trim().match(/^(\d+)\s*(s|m|h)$/i);
  if (!match) return null;
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000 };
  return amount * multipliers[unit];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timer')
    .setDescription('Set a countdown timer')
    .addStringOption((opt) => opt.setName('duration').setDescription('e.g. 30s, 10m, 1h').setRequired(true))
    .addStringOption((opt) => opt.setName('label').setDescription('What is this timer for?').setRequired(false)),

  async execute(interaction) {
    const durationText = interaction.options.getString('duration');
    const label = interaction.options.getString('label');
    const ms = parseDuration(durationText);

    if (!ms || ms > 24 * 60 * 60 * 1000) {
      return interaction.reply({ content: 'Invalid duration. Use s/m/h, e.g. `30s`, `10m`, `1h` (max 24h).', ephemeral: true });
    }

    await interaction.reply(`⏱️ Timer set for **${durationText}**${label ? ` — ${label}` : ''}. I'll ping you here when it's done.`);

    setTimeout(async () => {
      try {
        await interaction.channel.send(`⏰ ${interaction.user} Timer's up!${label ? ` — ${label}` : ''}`);
      } catch {
        // channel may be gone
      }
    }, ms);
  },
};
