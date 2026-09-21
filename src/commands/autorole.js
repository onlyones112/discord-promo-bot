const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setConfig, getConfig } = require('../utils/guildConfig');

function getAutoroles(guildId) {
  const { autorole } = getConfig(guildId);
  return { humanRoleIds: [], botRoleIds: [], ...(autorole || {}) };
}

module.exports = {
  getAutoroles,

  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Automatically give roles to new members, split by humans and bots')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub.setName('humans-add').setDescription('Add a role auto-given to human members on join').addRoleOption((opt) => opt.setName('role').setDescription('Role').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName('humans-remove').setDescription('Remove a human autorole').addRoleOption((opt) => opt.setName('role').setDescription('Role').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName('bots-add').setDescription('Add a role auto-given to bots on join').addRoleOption((opt) => opt.setName('role').setDescription('Role').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('bots-remove').setDescription('Remove a bot autorole').addRoleOption((opt) => opt.setName('role').setDescription('Role').setRequired(true)))
    .addSubcommand((sub) => sub.setName('reset').setDescription('Clear all autoroles'))
    .addSubcommand((sub) => sub.setName('config').setDescription('Show the current autorole configuration')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const current = getAutoroles(interaction.guild.id);

    const tooHigh = (role) => role.position >= interaction.guild.members.me.roles.highest.position;

    if (sub === 'humans-add') {
      const role = interaction.options.getRole('role');
      if (tooHigh(role)) return interaction.reply({ content: "I can't assign a role higher than or equal to my own highest role.", ephemeral: true });
      const humanRoleIds = [...new Set([...current.humanRoleIds, role.id])];
      setConfig(interaction.guild.id, { autorole: { ...current, humanRoleIds } });
      return interaction.reply(`${role} will now be auto-given to new human members.`);
    }

    if (sub === 'humans-remove') {
      const role = interaction.options.getRole('role');
      const humanRoleIds = current.humanRoleIds.filter((id) => id !== role.id);
      setConfig(interaction.guild.id, { autorole: { ...current, humanRoleIds } });
      return interaction.reply(`${role} removed from human autoroles.`);
    }

    if (sub === 'bots-add') {
      const role = interaction.options.getRole('role');
      if (tooHigh(role)) return interaction.reply({ content: "I can't assign a role higher than or equal to my own highest role.", ephemeral: true });
      const botRoleIds = [...new Set([...current.botRoleIds, role.id])];
      setConfig(interaction.guild.id, { autorole: { ...current, botRoleIds } });
      return interaction.reply(`${role} will now be auto-given to new bots.`);
    }

    if (sub === 'bots-remove') {
      const role = interaction.options.getRole('role');
      const botRoleIds = current.botRoleIds.filter((id) => id !== role.id);
      setConfig(interaction.guild.id, { autorole: { ...current, botRoleIds } });
      return interaction.reply(`${role} removed from bot autoroles.`);
    }

    if (sub === 'reset') {
      setConfig(interaction.guild.id, { autorole: { humanRoleIds: [], botRoleIds: [] } });
      return interaction.reply('All autoroles cleared.');
    }

    if (sub === 'config') {
      return interaction.reply({
        content:
          `**Human autoroles:** ${current.humanRoleIds.length ? current.humanRoleIds.map((id) => `<@&${id}>`).join(', ') : 'None'}\n` +
          `**Bot autoroles:** ${current.botRoleIds.length ? current.botRoleIds.map((id) => `<@&${id}>`).join(', ') : 'None'}`,
        ephemeral: true,
      });
    }
  },
};
