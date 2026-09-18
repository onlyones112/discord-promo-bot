const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Add or remove a role from a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add a role to a member')
        .addUserOption((opt) => opt.setName('user').setDescription('User').setRequired(true))
        .addRoleOption((opt) => opt.setName('role').setDescription('Role to add').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a role from a member')
        .addUserOption((opt) => opt.setName('user').setDescription('User').setRequired(true))
        .addRoleOption((opt) => opt.setName('role').setDescription('Role to remove').setRequired(true)),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({ content: "I can't manage a role that's higher than or equal to my own highest role.", ephemeral: true });
    }

    if (sub === 'add') {
      await member.roles.add(role);
      await interaction.reply(`Added ${role} to ${user.tag}.`);
    } else {
      await member.roles.remove(role);
      await interaction.reply(`Removed ${role} from ${user.tag}.`);
    }

    await logAction(interaction.guild, {
      title: sub === 'add' ? 'Role Added' : 'Role Removed',
      fields: [
        { name: 'User', value: `${user.tag} (${user.id})` },
        { name: 'Role', value: `${role}` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
      ],
    });
  },
};
