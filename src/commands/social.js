const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getProfile, addRep, setLastRepGiven, setBio } = require('../utils/socialStore');

const REP_COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours

module.exports = {
  data: new SlashCommandBuilder()
    .setName('social')
    .setDescription('Reputation and profile commands')
    .addSubcommand((sub) =>
      sub
        .setName('rep')
        .setDescription('Give someone reputation')
        .addUserOption((opt) => opt.setName('user').setDescription('User to give rep to').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('profile')
        .setDescription("View a member's profile")
        .addUserOption((opt) => opt.setName('user').setDescription('User to view (defaults to you)').setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('bio')
        .setDescription('Set your own bio')
        .addStringOption((opt) => opt.setName('text').setDescription('Your bio text').setRequired(true)),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'rep') {
      const target = interaction.options.getUser('user');
      if (target.id === interaction.user.id) {
        return interaction.reply({ content: "You can't rep yourself.", ephemeral: true });
      }

      const me = getProfile(interaction.guild.id, interaction.user.id);
      const remaining = me.lastRepGiven + REP_COOLDOWN_MS - Date.now();
      if (remaining > 0) {
        const hours = Math.ceil(remaining / 3600000);
        return interaction.reply({ content: `You can give rep again in about ${hours}h.`, ephemeral: true });
      }

      const newTotal = addRep(interaction.guild.id, target.id);
      setLastRepGiven(interaction.guild.id, interaction.user.id, Date.now());
      await interaction.reply(`⭐ ${interaction.user} gave a reputation point to ${target}! They now have **${newTotal}** rep.`);
    }

    if (sub === 'profile') {
      const user = interaction.options.getUser('user') || interaction.user;
      const profile = getProfile(interaction.guild.id, user.id);
      const embed = new EmbedBuilder()
        .setColor('#2F80ED')
        .setTitle(`${user.tag}'s Profile`)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .addFields({ name: 'Reputation', value: `⭐ ${profile.rep}`, inline: true })
        .setDescription(profile.bio || '*No bio set.*');
      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'bio') {
      const text = interaction.options.getString('text').slice(0, 300);
      setBio(interaction.guild.id, interaction.user.id, text);
      await interaction.reply({ content: 'Bio updated.', ephemeral: true });
    }
  },
};
