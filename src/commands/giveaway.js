const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createGiveaway, getGiveaway, endGiveaway: markEnded, getAllActive } = require('../utils/giveawayStore');
const { logAction } = require('../utils/logger');

const GOLD = '#F5C400';
const ENDED_COLOR = '#5A5A5A';
const DIVIDER = '⋆⋅☆⋅⋆';

function parseDuration(text) {
  const match = text.trim().match(/^(\d+)\s*(s|m|h|d)$/i);
  if (!match) return null;
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return amount * multipliers[unit];
}

function giveawayEmbed(giveaway, host, ended = false) {
  const embed = new EmbedBuilder()
    .setColor(ended ? ENDED_COLOR : GOLD)
    .setAuthor({ name: ended ? 'GIVEAWAY ENDED' : 'GIVEAWAY', iconURL: host?.displayAvatarURL?.() })
    .setTitle(`🎁 ${giveaway.prize}`)
    .setDescription(
      `${DIVIDER}\n` +
        (ended ? '*This giveaway has ended — thanks for entering!*' : '**React below with 🎉 to enter!**') +
        (giveaway.requiredRoleId ? `\n\n🔐 Requires role: <@&${giveaway.requiredRoleId}>` : '') +
        `\n${DIVIDER}`,
    )
    .addFields(
      { name: '🏆 Winners', value: `${giveaway.winnerCount}`, inline: true },
      { name: '🎟️ Entries', value: `${giveaway.participants.length}`, inline: true },
      { name: '⏰ Ends', value: ended ? 'Ended' : `<t:${Math.floor(giveaway.endTimestamp / 1000)}:R>`, inline: true },
    )
    .setThumbnail(host?.displayAvatarURL?.({ size: 256 }) || null)
    .setFooter({ text: `Hosted by ${giveaway.hostTag}` })
    .setTimestamp(ended ? Date.now() : giveaway.endTimestamp);
  return embed;
}

async function finishGiveaway(client, messageId) {
  const giveaway = getGiveaway(messageId);
  if (!giveaway || giveaway.ended) return;

  try {
    const channel = await client.channels.fetch(giveaway.channelId);
    const msg = await channel.messages.fetch(messageId);
    const host = await client.users.fetch(giveaway.hostId).catch(() => null);

    const pool = [...giveaway.participants];
    const winners = [];
    for (let i = 0; i < giveaway.winnerCount && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      winners.push(pool.splice(idx, 1)[0]);
    }

    markEnded(messageId);

    await msg.edit({ embeds: [giveawayEmbed(giveaway, host, true)], components: [] });

    if (winners.length === 0) {
      await channel.send({
        embeds: [new EmbedBuilder().setColor(ENDED_COLOR).setDescription(`😔 No valid entries for **${giveaway.prize}** — no winner could be picked.`)],
      });
    } else {
      await channel.send({
        content: winners.map((w) => `<@${w}>`).join(', '),
        embeds: [
          new EmbedBuilder()
            .setColor(GOLD)
            .setTitle('🎉 We have a winner!')
            .setDescription(`Congratulations ${winners.map((w) => `<@${w}>`).join(', ')}!\nYou won **${giveaway.prize}** 🎁`),
        ],
      });
    }

    await logAction(channel.guild, {
      type: 'general',
      title: 'Giveaway Ended',
      color: GOLD,
      fields: [
        { name: 'Prize', value: giveaway.prize },
        { name: 'Winners', value: winners.length ? winners.map((w) => `<@${w}>`).join(', ') : 'None' },
      ],
    });
  } catch (err) {
    console.error('Failed to finish giveaway', messageId, err);
  }
}

module.exports = {
  finishGiveaway,
  giveawayEmbed,

  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Run a giveaway')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('start')
        .setDescription('Start a giveaway')
        .addStringOption((opt) => opt.setName('prize').setDescription('What are you giving away?').setRequired(true))
        .addStringOption((opt) => opt.setName('duration').setDescription('e.g. 30s, 10m, 2h, 1d').setRequired(true))
        .addIntegerOption((opt) => opt.setName('winners').setDescription('Number of winners').setMinValue(1).setMaxValue(20).setRequired(false))
        .addChannelOption((opt) => opt.setName('channel').setDescription('Channel to post in (defaults to here)').addChannelTypes(ChannelType.GuildText).setRequired(false))
        .addRoleOption((opt) => opt.setName('required_role').setDescription('Only members with this role can enter').setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('end')
        .setDescription('End a giveaway early')
        .addStringOption((opt) => opt.setName('message_id').setDescription('The giveaway message ID').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('reroll')
        .setDescription('Pick a new winner for an ended giveaway')
        .addStringOption((opt) => opt.setName('message_id').setDescription('The giveaway message ID').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List all currently active giveaways')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const prize = interaction.options.getString('prize');
      const durationText = interaction.options.getString('duration');
      const winnerCount = interaction.options.getInteger('winners') || 1;
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      const requiredRole = interaction.options.getRole('required_role');

      const durationMs = parseDuration(durationText);
      if (!durationMs) {
        return interaction.reply({ content: 'Invalid duration. Use a number + s/m/h/d, e.g. `30s`, `10m`, `2h`, `1d`.', ephemeral: true });
      }

      const endTimestamp = Date.now() + durationMs;
      const giveawayData = {
        channelId: channel.id,
        guildId: interaction.guild.id,
        prize,
        winnerCount,
        endTimestamp,
        hostId: interaction.user.id,
        hostTag: interaction.user.tag,
        requiredRoleId: requiredRole?.id || null,
        participants: [],
        ended: false,
      };

      const msg = await channel.send({ embeds: [giveawayEmbed(giveawayData, interaction.user)], components: [] });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`giveaway_enter:${msg.id}`).setLabel('Enter Giveaway').setEmoji('🎉').setStyle(ButtonStyle.Success),
      );
      await msg.edit({ components: [row] });

      createGiveaway({ ...giveawayData, messageId: msg.id });

      await interaction.reply({ content: `🎁 Giveaway started in ${channel}!`, ephemeral: true });
      await logAction(interaction.guild, {
        type: 'general',
        title: 'Giveaway Started',
        color: GOLD,
        fields: [
          { name: 'Prize', value: prize },
          { name: 'Duration', value: durationText },
          { name: 'Host', value: interaction.user.tag },
        ],
      });
    }

    if (sub === 'end') {
      const messageId = interaction.options.getString('message_id');
      const giveaway = getGiveaway(messageId);
      if (!giveaway) return interaction.reply({ content: 'No giveaway found with that message ID.', ephemeral: true });
      if (giveaway.ended) return interaction.reply({ content: 'That giveaway already ended.', ephemeral: true });

      await interaction.reply({ content: 'Ending it now...', ephemeral: true });
      await finishGiveaway(interaction.client, messageId);
    }

    if (sub === 'reroll') {
      const messageId = interaction.options.getString('message_id');
      const giveaway = getGiveaway(messageId);
      if (!giveaway) return interaction.reply({ content: 'No giveaway found with that message ID.', ephemeral: true });
      if (!giveaway.ended) return interaction.reply({ content: "That giveaway hasn't ended yet.", ephemeral: true });
      if (giveaway.participants.length === 0) return interaction.reply({ content: 'No entries to reroll from.', ephemeral: true });

      const winner = giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)];
      const channel = await interaction.client.channels.fetch(giveaway.channelId);
      await channel.send({
        embeds: [new EmbedBuilder().setColor(GOLD).setTitle('🎉 New Winner!').setDescription(`New winner for **${giveaway.prize}**: <@${winner}>!`)],
      });
      await interaction.reply({ content: 'Rerolled.', ephemeral: true });
    }

    if (sub === 'list') {
      const active = getAllActive().filter((g) => g.guildId === interaction.guild.id);
      if (active.length === 0) return interaction.reply({ content: 'No active giveaways right now.', ephemeral: true });
      const embed = new EmbedBuilder()
        .setColor(GOLD)
        .setTitle('🎁 Active Giveaways')
        .setDescription(active.map((g) => `**${g.prize}** — ${DIVIDER}\n<#${g.channelId}> · ends <t:${Math.floor(g.endTimestamp / 1000)}:R> · \`${g.messageId}\``).join('\n\n'));
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
