const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig } = require('../utils/guildConfig');

function getAntinuke(guildId) {
  const { antinuke } = getConfig(guildId);
  return antinuke || { enabled: false, whitelist: [] };
}

module.exports = {
  getAntinuke,

  data: new SlashCommandBuilder()
    .setName('antinuke')
    .setDescription('Protect the server from mass-destruction attacks (channel/role deletion spam)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub.setName('enable').setDescription('Turn Antinuke on'))
    .addSubcommand((sub) => sub.setName('disable').setDescription('Turn Antinuke off'))
    .addSubcommand((sub) =>
      sub
        .setName('whitelist-add')
        .setDescription('Trust a user to bypass Antinuke (add other admins/bots here)')
        .addUserOption((opt) => opt.setName('user').setDescription('User to whitelist').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('whitelist-remove')
        .setDescription('Remove a user from the whitelist')
        .addUserOption((opt) => opt.setName('user').setDescription('User to remove').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('view').setDescription('Show current Antinuke settings')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const current = getAntinuke(interaction.guild.id);

    if (sub === 'enable') {
      setConfig(interaction.guild.id, { antinuke: { ...current, enabled: true } });
      return interaction.reply('🛡️ Antinuke is now **enabled**. Mass channel/role deletion by non-whitelisted members will get them banned automatically.');
    }

    if (sub === 'disable') {
      setConfig(interaction.guild.id, { antinuke: { ...current, enabled: false } });
      return interaction.reply('Antinuke is now **disabled**.');
    }

    if (sub === 'whitelist-add') {
      const user = interaction.options.getUser('user');
      const whitelist = [...new Set([...current.whitelist, user.id])];
      setConfig(interaction.guild.id, { antinuke: { ...current, whitelist } });
      return interaction.reply(`${user.tag} is now whitelisted and won't be actioned by Antinuke.`);
    }

    if (sub === 'whitelist-remove') {
      const user = interaction.options.getUser('user');
      const whitelist = current.whitelist.filter((id) => id !== user.id);
      setConfig(interaction.guild.id, { antinuke: { ...current, whitelist } });
      return interaction.reply(`${user.tag} removed from the whitelist.`);
    }

    if (sub === 'view') {
      const list = current.whitelist.length ? current.whitelist.map((id) => `<@${id}>`).join(', ') : 'None';
      return interaction.reply({
        content: `**Antinuke:** ${current.enabled ? '✅ Enabled' : '❌ Disabled'}\n**Whitelist:** ${list}`,
        ephemeral: true,
      });
    }
  },
};
