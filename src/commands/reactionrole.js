const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { addMapping, removeMapping, getMappings } = require('../utils/reactionRoleStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Let members react to a message to get a role')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Link an emoji reaction on a message to a role')
        .addStringOption((opt) => opt.setName('message_id').setDescription('The message ID to react to').setRequired(true))
        .addStringOption((opt) => opt.setName('emoji').setDescription('The emoji (unicode or custom)').setRequired(true))
        .addRoleOption((opt) => opt.setName('role').setDescription('Role to give when reacted').setRequired(true))
        .addChannelOption((opt) => opt.setName('channel').setDescription('Channel the message is in (defaults to here)').addChannelTypes(ChannelType.GuildText).setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Unlink an emoji from a message')
        .addStringOption((opt) => opt.setName('message_id').setDescription('The message ID').setRequired(true))
        .addStringOption((opt) => opt.setName('emoji').setDescription('The emoji to unlink').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('List emoji/role links on a message')
        .addStringOption((opt) => opt.setName('message_id').setDescription('The message ID').setRequired(true)),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const messageId = interaction.options.getString('message_id');

    if (sub === 'add') {
      const emoji = interaction.options.getString('emoji');
      const role = interaction.options.getRole('role');
      const channel = interaction.options.getChannel('channel') || interaction.channel;

      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({ content: "I can't assign a role higher than or equal to my own highest role.", ephemeral: true });
      }

      try {
        const msg = await channel.messages.fetch(messageId);
        await msg.react(emoji);
        addMapping(messageId, emoji, role.id);
        await interaction.reply(`Reacting ${emoji} on that message now gives ${role}.`);
      } catch (err) {
        await interaction.reply({ content: "Couldn't react to that message — check the message ID/channel, and that the emoji is valid (custom emojis must be from a server I'm in).", ephemeral: true });
      }
    }

    if (sub === 'remove') {
      const emoji = interaction.options.getString('emoji');
      removeMapping(messageId, emoji);
      await interaction.reply(`Removed the ${emoji} link from that message.`);
    }

    if (sub === 'list') {
      const mappings = getMappings(messageId);
      if (mappings.length === 0) return interaction.reply({ content: 'No reaction roles set on that message.', ephemeral: true });
      const lines = mappings.map((m) => `${m.emoji} → <@&${m.roleId}>`);
      await interaction.reply({ content: lines.join('\n'), ephemeral: true });
    }
  },
};
