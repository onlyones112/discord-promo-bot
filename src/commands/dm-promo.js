const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../utils/logger');

// Small delay between DMs so we don't slam Discord's rate limits / get flagged.
const DELAY_MS = 900;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendDm(member, embed) {
  try {
    await member.send({ embeds: [embed] });
    return true;
  } catch {
    return false; // DMs closed, blocked the bot, left server, etc.
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm-promo')
    .setDescription('Send a promotional/announcement DM')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('all')
        .setDescription('DM every member in this server')
        .addStringOption((opt) => opt.setName('message').setDescription('The message to send').setRequired(true))
        .addStringOption((opt) => opt.setName('title').setDescription('Embed title').setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('role')
        .setDescription('DM everyone with a specific role')
        .addRoleOption((opt) => opt.setName('role').setDescription('Target role').setRequired(true))
        .addStringOption((opt) => opt.setName('message').setDescription('The message to send').setRequired(true))
        .addStringOption((opt) => opt.setName('title').setDescription('Embed title').setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('users')
        .setDescription('DM specific users')
        .addStringOption((opt) =>
          opt.setName('users').setDescription('@mention or user IDs, space or comma separated').setRequired(true),
        )
        .addStringOption((opt) => opt.setName('message').setDescription('The message to send').setRequired(true))
        .addStringOption((opt) => opt.setName('title').setDescription('Embed title').setRequired(false)),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const message = interaction.options.getString('message');
    const title = interaction.options.getString('title') || `Message from ${interaction.guild.name}`;

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(title)
      .setDescription(message)
      .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() || undefined });

    await interaction.deferReply({ ephemeral: true });

    let targets = [];

    if (sub === 'all') {
      const members = await interaction.guild.members.fetch();
      targets = members.filter((m) => !m.user.bot).map((m) => m);
    } else if (sub === 'role') {
      const role = interaction.options.getRole('role');
      const members = await interaction.guild.members.fetch();
      targets = members.filter((m) => !m.user.bot && m.roles.cache.has(role.id)).map((m) => m);
    } else if (sub === 'users') {
      const raw = interaction.options.getString('users');
      const ids = [...raw.matchAll(/\d{15,20}/g)].map((m) => m[0]);
      const uniqueIds = [...new Set(ids)];
      for (const id of uniqueIds) {
        try {
          const member = await interaction.guild.members.fetch(id);
          targets.push(member);
        } catch {
          // not a member of this guild, skip
        }
      }
    }

    if (targets.length === 0) {
      return interaction.editReply('No valid targets found for that option.');
    }

    let sent = 0;
    let failed = 0;

    for (const member of targets) {
      const ok = await sendDm(member, embed);
      if (ok) sent++;
      else failed++;
      await sleep(DELAY_MS);
    }

    await interaction.editReply(
      `Done. Sent: **${sent}** · Failed (DMs closed/left server): **${failed}** · Total targeted: **${targets.length}**`,
    );

    await logAction(interaction.guild, {
      title: 'DM Promo Broadcast',
      color: '#5865F2',
      fields: [
        { name: 'Mode', value: sub },
        { name: 'Moderator', value: `${interaction.user.tag}` },
        { name: 'Sent', value: `${sent}` },
        { name: 'Failed', value: `${failed}` },
        { name: 'Message', value: message.slice(0, 1000) },
      ],
    });
  },
};
