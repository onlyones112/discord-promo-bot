const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');
const { getDraft, resetDraft, buildEmbed } = require('../utils/embedStore');
const { builderRows } = require('../commands/embed');
const { logAction } = require('../utils/logger');
const { getConfig } = require('../utils/guildConfig');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
        return;
      }

      if (interaction.isButton()) {
        await handleButton(interaction);
        return;
      }

      if (interaction.isModalSubmit()) {
        await handleModal(interaction);
        return;
      }
    } catch (err) {
      console.error(err);
      const payload = { content: 'Something went wrong running that.', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};

// ---------- Buttons ----------

async function handleButton(interaction) {
  const id = interaction.customId;

  if (id.startsWith('embed_')) return handleEmbedButton(interaction, id);
  if (id.startsWith('ticket_create:')) return createTicket(interaction, id);
  if (id === 'ticket_close') return closeTicket(interaction);
  if (id === 'ticket_delete') return deleteTicket(interaction);
}

async function handleEmbedButton(interaction, id) {
  const draft = getDraft(interaction.user.id);

  const modalFor = {
    embed_title: () => {
      const modal = new ModalBuilder().setCustomId('embedmodal_title').setTitle('Title & Description');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('title').setLabel('Title').setStyle(TextInputStyle.Short).setRequired(false).setValue(draft.title || ''),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(draft.description || ''),
        ),
      );
      return modal;
    },
    embed_color: () => {
      const modal = new ModalBuilder().setCustomId('embedmodal_color').setTitle('Color');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('color').setLabel('Hex color (e.g. #5865F2)').setStyle(TextInputStyle.Short).setRequired(false).setValue(draft.color || ''),
        ),
      );
      return modal;
    },
    embed_author: () => {
      const modal = new ModalBuilder().setCustomId('embedmodal_author').setTitle('Author');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('author').setLabel('Author name').setStyle(TextInputStyle.Short).setRequired(false).setValue(draft.author || ''),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('authorIcon').setLabel('Author icon URL').setStyle(TextInputStyle.Short).setRequired(false).setValue(draft.authorIcon || ''),
        ),
      );
      return modal;
    },
    embed_field: () => {
      const modal = new ModalBuilder().setCustomId('embedmodal_field').setTitle('Add Field');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('name').setLabel('Field name').setStyle(TextInputStyle.Short).setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('value').setLabel('Field value').setStyle(TextInputStyle.Paragraph).setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('inline').setLabel('Inline? (yes/no)').setStyle(TextInputStyle.Short).setRequired(false).setValue('no'),
        ),
      );
      return modal;
    },
    embed_footer: () => {
      const modal = new ModalBuilder().setCustomId('embedmodal_footer').setTitle('Footer');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('footer').setLabel('Footer text').setStyle(TextInputStyle.Short).setRequired(false).setValue(draft.footer || ''),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('footerIcon').setLabel('Footer icon URL').setStyle(TextInputStyle.Short).setRequired(false).setValue(draft.footerIcon || ''),
        ),
      );
      return modal;
    },
    embed_images: () => {
      const modal = new ModalBuilder().setCustomId('embedmodal_images').setTitle('Image & Thumbnail');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('image').setLabel('Image URL (big, bottom)').setStyle(TextInputStyle.Short).setRequired(false).setValue(draft.image || ''),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('thumbnail').setLabel('Thumbnail URL (small, top-right)').setStyle(TextInputStyle.Short).setRequired(false).setValue(draft.thumbnail || ''),
        ),
      );
      return modal;
    },
  };

  if (modalFor[id]) {
    return interaction.showModal(modalFor[id]());
  }

  if (id === 'embed_reset') {
    resetDraft(interaction.user.id);
    const embed = buildEmbed(getDraft(interaction.user.id));
    return interaction.update({ content: 'Draft reset.', embeds: [embed], components: builderRows() });
  }

  if (id === 'embed_cancel') {
    resetDraft(interaction.user.id);
    return interaction.update({ content: 'Cancelled.', embeds: [], components: [] });
  }

  if (id === 'embed_send') {
    const embed = buildEmbed(draft);

    if (draft.editTarget) {
      try {
        const channel = await interaction.client.channels.fetch(draft.editTarget.channelId);
        const msg = await channel.messages.fetch(draft.editTarget.messageId);
        await msg.edit({ embeds: [embed] });
        resetDraft(interaction.user.id);
        await logAction(interaction.guild, {
          title: 'Embed Edited',
          fields: [
            { name: 'Channel', value: `<#${draft.editTarget.channelId}>` },
            { name: 'Edited by', value: `${interaction.user.tag}` },
          ],
        });
        return interaction.update({ content: 'Message updated.', embeds: [], components: [] });
      } catch {
        return interaction.update({ content: 'Failed to update the original message (it may have been deleted).', embeds: [], components: [] });
      }
    }

    await interaction.channel.send({ embeds: [embed] });
    resetDraft(interaction.user.id);
    await logAction(interaction.guild, {
      title: 'Embed Sent',
      fields: [
        { name: 'Channel', value: `${interaction.channel}` },
        { name: 'Sent by', value: `${interaction.user.tag}` },
      ],
    });
    return interaction.update({ content: 'Sent!', embeds: [], components: [] });
  }
}

// ---------- Modals ----------

async function handleModal(interaction) {
  const id = interaction.customId;
  if (!id.startsWith('embedmodal_')) return;

  const draft = getDraft(interaction.user.id);

  if (id === 'embedmodal_title') {
    draft.title = interaction.fields.getTextInputValue('title') || null;
    draft.description = interaction.fields.getTextInputValue('description') || null;
  } else if (id === 'embedmodal_color') {
    const color = interaction.fields.getTextInputValue('color');
    draft.color = color && /^#?[0-9A-Fa-f]{6}$/.test(color) ? (color.startsWith('#') ? color : `#${color}`) : draft.color;
  } else if (id === 'embedmodal_author') {
    draft.author = interaction.fields.getTextInputValue('author') || null;
    draft.authorIcon = interaction.fields.getTextInputValue('authorIcon') || null;
  } else if (id === 'embedmodal_field') {
    const name = interaction.fields.getTextInputValue('name');
    const value = interaction.fields.getTextInputValue('value');
    const inline = /^y/i.test(interaction.fields.getTextInputValue('inline') || 'no');
    draft.fields.push({ name, value, inline });
  } else if (id === 'embedmodal_footer') {
    draft.footer = interaction.fields.getTextInputValue('footer') || null;
    draft.footerIcon = interaction.fields.getTextInputValue('footerIcon') || null;
  } else if (id === 'embedmodal_images') {
    draft.image = interaction.fields.getTextInputValue('image') || null;
    draft.thumbnail = interaction.fields.getTextInputValue('thumbnail') || null;
  }

  const embed = buildEmbed(draft);
  await interaction.update({ embeds: [embed], components: builderRows() });
}

// ---------- Tickets ----------
// Button customId carries everything it needs: ticket_create:<categoryId>:<roleId|none>:<labelSlug>
// so one panel per category/type works with zero extra storage.

async function createTicket(interaction, customId) {
  const [, categoryId, roleId, labelSlug] = customId.split(':');
  const guild = interaction.guild;

  const channelName = `${labelSlug}-${interaction.user.username}`.toLowerCase().slice(0, 90);
  const existing = guild.channels.cache.find((c) => c.name === channelName && c.type === ChannelType.GuildText);
  if (existing) {
    return interaction.reply({ content: `You already have an open ${labelSlug} ticket: ${existing}`, ephemeral: true });
  }

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: interaction.user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    },
    {
      id: interaction.client.user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
    },
  ];

  if (roleId && roleId !== 'none') {
    overwrites.push({
      id: roleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    });
  }

  let channel;
  try {
    channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryId,
      topic: `Ticket opened by ${interaction.user.id} | type:${labelSlug}`,
      permissionOverwrites: overwrites,
    });
  } catch (err) {
    return interaction.reply({ content: "Couldn't create the ticket channel — check that the category still exists and I have Manage Channels permission there.", ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`${labelSlug} Ticket Opened`)
    .setDescription(`Hi ${interaction.user}, our team will be with you shortly. Explain your issue below.`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
  );

  await channel.send({ content: roleId && roleId !== 'none' ? `<@&${roleId}>` : undefined, embeds: [embed], components: [row] });
  await interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });

  await logAction(guild, {
    title: 'Ticket Opened',
    color: '#57F287',
    fields: [
      { name: 'Type', value: labelSlug, inline: true },
      { name: 'User', value: `${interaction.user.tag}`, inline: true },
      { name: 'Channel', value: `${channel}` },
    ],
  });
}

async function closeTicket(interaction) {
  const { closedCategoryId } = getConfig(interaction.guild.id);
  const opener = interaction.channel.topic?.match(/Ticket opened by (\d+)/)?.[1];

  if (!closedCategoryId) {
    // No archive category configured — fall back to the simple delete-after-5s behaviour.
    await interaction.reply('Closing this ticket in 5 seconds...');
    await logAction(interaction.guild, {
      title: 'Ticket Closed (deleted)',
      color: '#ED4245',
      fields: [
        { name: 'Channel', value: `#${interaction.channel.name}` },
        { name: 'Closed by', value: `${interaction.user.tag}` },
      ],
    });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    return;
  }

  try {
    // Move to the archive category and stop the ticket opener from posting further.
    await interaction.channel.setParent(closedCategoryId, { lockPermissions: false });
    if (opener) {
      await interaction.channel.permissionOverwrites.edit(opener, { SendMessages: false });
    }
    const newName = `closed-${interaction.channel.name}`.slice(0, 90);
    await interaction.channel.setName(newName).catch(() => {});
  } catch (err) {
    return interaction.reply({ content: "Couldn't move this ticket to the closed category — check that it still exists and I have Manage Channels permission there.", ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setColor('#ED4245')
    .setTitle('Ticket Closed')
    .setDescription(`Closed by ${interaction.user}. Moved to the archive — a staff member can delete it permanently below.`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_delete').setLabel('Delete Permanently').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
  );

  await interaction.reply({ embeds: [embed], components: [row] });

  await logAction(interaction.guild, {
    title: 'Ticket Closed (archived)',
    color: '#ED4245',
    fields: [
      { name: 'Channel', value: `#${interaction.channel.name}` },
      { name: 'Closed by', value: `${interaction.user.tag}` },
    ],
  });
}

async function deleteTicket(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({ content: "You need Manage Channels permission to delete tickets.", ephemeral: true });
  }
  await interaction.reply('Deleting...');
  await logAction(interaction.guild, {
    title: 'Ticket Deleted',
    color: '#ED4245',
    fields: [
      { name: 'Channel', value: `#${interaction.channel.name}` },
      { name: 'Deleted by', value: `${interaction.user.tag}` },
    ],
  });
  setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
}
