const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig } = require('../utils/guildConfig');
const { MAX_PANELS } = require('./ticket-panel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panels')
    .setDescription('Manage your configured ticket panels')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) => sub.setName('list').setDescription('List all configured ticket panels'))
    .addSubcommand((sub) =>
      sub.setName('remove').setDescription('Remove a ticket panel by label').addStringOption((opt) => opt.setName('label').setDescription('The label you gave it').setRequired(true)),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const panels = getConfig(interaction.guild.id).ticketPanels || [];

    if (sub === 'list') {
      if (panels.length === 0) return interaction.reply({ content: `No ticket panels configured yet (max ${MAX_PANELS}). Use \`/ticket-panel\` to create one.`, ephemeral: true });
      const lines = panels.map((p) => `**${p.label}** — <#${p.channelId}> → category <#${p.categoryId}>${p.roleId ? ` (pings <@&${p.roleId}>)` : ''}`);
      return interaction.reply({ content: `${panels.length}/${MAX_PANELS} panels:\n${lines.join('\n')}`, ephemeral: true });
    }

    if (sub === 'remove') {
      const label = interaction.options.getString('label');
      const match = panels.find((p) => p.label.toLowerCase() === label.toLowerCase());
      if (!match) return interaction.reply({ content: `No panel found with label "${label}". Use \`/ticket-panels list\` to see them.`, ephemeral: true });

      try {
        const channel = await interaction.guild.channels.fetch(match.channelId);
        const msg = await channel.messages.fetch(match.messageId);
        await msg.delete();
      } catch {
        // message already gone — still remove it from tracking
      }

      const updated = panels.filter((p) => p.messageId !== match.messageId);
      setConfig(interaction.guild.id, { ticketPanels: updated });
      return interaction.reply(`Removed the **${match.label}** ticket panel (${updated.length}/${MAX_PANELS} remaining).`);
    }
  },
};
