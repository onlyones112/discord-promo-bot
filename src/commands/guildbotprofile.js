const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guildbotprofile')
    .setDescription("Customize how I appear in this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName('nickname').setDescription('Set my nickname in this server').addStringOption((opt) => opt.setName('name').setDescription('New nickname').setRequired(true).setMaxLength(32)),
    )
    .addSubcommand((sub) => sub.setName('reset-nickname').setDescription('Reset my nickname back to default'))
    .addSubcommand((sub) => sub.setName('view').setDescription('Show my current profile in this server')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const me = interaction.guild.members.me;

    if (sub === 'nickname') {
      const name = interaction.options.getString('name');
      if (!me.manageable) {
        return interaction.reply({ content: "I can't change my own nickname here — my role might be missing permission, or another role outranks me.", ephemeral: true });
      }
      await me.setNickname(name);
      return interaction.reply(`Nickname in this server set to **${name}**.`);
    }

    if (sub === 'reset-nickname') {
      await me.setNickname(null).catch(() => {});
      return interaction.reply('Nickname reset to my default username.');
    }

    if (sub === 'view') {
      const embed = new EmbedBuilder()
        .setColor('#2F80ED')
        .setTitle(`${interaction.client.user.username}'s Profile — ${interaction.guild.name}`)
        .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: 'Nickname Here', value: me.nickname || '*(none set — using default username)*', inline: true },
          { name: 'Joined This Server', value: `<t:${Math.floor(me.joinedTimestamp / 1000)}:R>`, inline: true },
        );
      return interaction.reply({ embeds: [embed] });
    }
  },
};
