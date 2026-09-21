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
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
} = require('discord.js');
const { getDraft, resetDraft, buildEmbed } = require('../utils/embedStore');
const { builderRows } = require('../commands/embed');
const { logAction } = require('../utils/logger');
const { getConfig, setConfig } = require('../utils/guildConfig');
const { categoryEmbed, selectRow, mainEmbed } = require('../commands/help');
const { addParticipant, getGiveaway } = require('../utils/giveawayStore');
const { giveawayEmbed } = require('../commands/giveaway');
const { canRunModCommand } = require('../utils/modPermsCheck');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        if (command.moderationCommand && !canRunModCommand(interaction.member, interaction.commandName)) {
          return interaction.reply({ content: "You don't have permission to use this command. Ask an admin to grant your role access via `/modperms`.", ephemeral: true });
        }
        await command.execute(interaction);
        return;
      }

      if (interaction.isButton()) {
        await handleButton(interaction);
        return;
      }

      if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction);
        return;
      }

      if (interaction.isChannelSelectMenu()) {
        await handleChannelSelectMenu(interaction);
        return;
      }

      if (interaction.isRoleSelectMenu()) {
        await handleRoleSelectMenu(interaction);
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
  if (id.startsWith('giveaway_enter:')) return enterGiveaway(interaction, id);
  if (id.startsWith('panel_antinuke_')) return handleAntinukePanel(interaction, id);
  if (id.startsWith('panel_automod_')) return handleAutomodPanel(interaction, id);
  if (id.startsWith('panel_mod_')) return handleModPanel(interaction, id);
  if (id.startsWith('panel_rolelock_')) return handleRoleLockPanel(interaction, id);
  if (id.startsWith('panel_ticket_')) return handleTicketPanel(interaction, id);
  if (id.startsWith('panel_modperms_')) return handleModPermsPanel(interaction, id);
  if (id.startsWith('panel_autorole_')) return handleAutorolePanel(interaction, id);
  if (id.startsWith('panel_noprefix_')) return handleNoPrefixPanel(interaction, id);
}

// ---------- Panels ----------

async function handleAntinukePanel(interaction, id) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: 'You need Administrator permission to use this panel.', ephemeral: true });
  }
  const { getAntinuke } = require('../commands/antinuke');
  const { panelEmbed, panelRows } = require('../commands/antinuke-panel');

  if (id === 'panel_antinuke_toggle') {
    const current = getAntinuke(interaction.guild.id);
    setConfig(interaction.guild.id, { antinuke: { ...current, enabled: !current.enabled } });
    const settings = getAntinuke(interaction.guild.id);
    return interaction.update({ embeds: [panelEmbed(settings, interaction.user.username)], components: panelRows() });
  }

  if (id === 'panel_antinuke_trustedowner') {
    const modal = new ModalBuilder().setCustomId(`antinukemodal_trustedowner:${interaction.message.id}`).setTitle('Add Trusted Owner');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('userid').setLabel('User ID to trust').setStyle(TextInputStyle.Short).setRequired(true),
      ),
    );
    return interaction.showModal(modal);
  }

  if (id === 'panel_antinuke_punishment') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`panel_antinuke_punishset:ban:${interaction.message.id}`).setLabel('Ban').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`panel_antinuke_punishset:kick:${interaction.message.id}`).setLabel('Kick').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`panel_antinuke_punishset:timeout:${interaction.message.id}`).setLabel('Timeout').setStyle(ButtonStyle.Secondary),
    );
    return interaction.reply({ content: 'Choose the punishment for unauthorized nukers:', components: [row], ephemeral: true });
  }

  if (id.startsWith('panel_antinuke_punishset:')) {
    const [, type, originalMessageId] = id.split(':');
    const current = getAntinuke(interaction.guild.id);
    setConfig(interaction.guild.id, { antinuke: { ...current, punishment: type } });
    await interaction.update({ content: `Punishment set to **${type}**.`, components: [] });
    await refreshAntinukePanel(interaction, originalMessageId);
    return;
  }

  if (id === 'panel_antinuke_logchannel') {
    const row = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder().setCustomId(`panel_antinuke_logchannel_select:${interaction.message.id}`).setChannelTypes(ChannelType.GuildText).setPlaceholder('Choose a log channel'),
    );
    return interaction.reply({ content: 'Select the Antinuke log channel:', components: [row], ephemeral: true });
  }

  if (id === 'panel_antinuke_quarantine') {
    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder().setCustomId(`panel_antinuke_quarantine_select:${interaction.message.id}`).setPlaceholder('Choose a quarantine role'),
    );
    return interaction.reply({ content: 'Select the role used to cage unauthorized nukers:', components: [row], ephemeral: true });
  }

  if (id === 'panel_antinuke_close') {
    return interaction.update({ content: 'Panel closed.', embeds: [], components: [] });
  }
}

async function refreshAntinukePanel(interaction, originalMessageId) {
  const { getAntinuke } = require('../commands/antinuke');
  const { panelEmbed, panelRows } = require('../commands/antinuke-panel');
  try {
    const channel = interaction.channel;
    const original = await channel.messages.fetch(originalMessageId);
    const settings = getAntinuke(interaction.guild.id);
    await original.edit({ embeds: [panelEmbed(settings, interaction.user.username)], components: panelRows() });
  } catch {
    // original panel may have been deleted — non-fatal
  }
}

async function handleAutomodPanel(interaction, id) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: 'You need Manage Server permission to use this panel.', ephemeral: true });
  }
  const { getAutomod } = require('../commands/automod');
  const { panelEmbed, panelRow } = require('../commands/automod-panel');

  const filter = id.split(':')[1];
  const current = getAutomod(interaction.guild.id);
  setConfig(interaction.guild.id, { automod: { ...current, [filter]: !current[filter] } });

  const settings = getAutomod(interaction.guild.id);
  await interaction.update({ embeds: [panelEmbed(settings)], components: [panelRow(settings)] });
}

async function handleModPanel(interaction, id) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({ content: 'You need Manage Messages permission to use this panel.', ephemeral: true });
  }

  if (id === 'panel_mod_lock') {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
    await interaction.reply('🔒 Channel locked.');
  } else if (id === 'panel_mod_unlock') {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
    await interaction.reply('🔓 Channel unlocked.');
  } else if (id === 'panel_mod_purge10') {
    await interaction.deferReply({ ephemeral: true });
    const messages = await interaction.channel.messages.fetch({ limit: 10 });
    const deleted = await interaction.channel.bulkDelete(messages, true).catch(() => null);
    await interaction.editReply(deleted ? `Deleted ${deleted.size} message(s).` : 'Could not delete (messages older than 14 days?).');
  } else if (id === 'panel_mod_logchannel') {
    const row = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder().setCustomId(`panel_mod_logchannel_select:${interaction.message.id}`).setChannelTypes(ChannelType.GuildText).setPlaceholder('Choose the mod log channel'),
    );
    await interaction.reply({ content: 'Select the moderation log channel:', components: [row], ephemeral: true });
  } else if (id === 'panel_mod_close') {
    await interaction.update({ content: 'Panel closed.', embeds: [], components: [] });
  }
}

async function handleTicketPanel(interaction, id) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: 'You need Manage Server permission to use this panel.', ephemeral: true });
  }

  if (id === 'panel_ticket_closedcategory') {
    const row = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder().setCustomId(`panel_ticket_closedcategory_select:${interaction.message.id}`).setChannelTypes(ChannelType.GuildCategory).setPlaceholder('Choose the closed-ticket category'),
    );
    return interaction.reply({ content: 'Select the category closed tickets should move into:', components: [row], ephemeral: true });
  }

  if (id === 'panel_ticket_close') {
    return interaction.update({ content: 'Panel closed.', embeds: [], components: [] });
  }
}

async function handleModPermsPanel(interaction, id) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: 'You need Administrator permission to use this panel.', ephemeral: true });
  }

  if (id === 'panel_modperms_role') {
    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder().setCustomId(`panel_modperms_muterole_select:${interaction.message.id}`).setPlaceholder('Choose the mute role'),
    );
    return interaction.reply({ content: 'Select the chat-mute role:', components: [row], ephemeral: true });
  }

  if (id === 'panel_modperms_limit') {
    const modal = new ModalBuilder().setCustomId(`modpermsmodal_limit:${interaction.message.id}`).setTitle('Ban/Kick Limit');
    modal.addComponents(
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('count').setLabel('Max bans/kicks').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('hours').setLabel('Per how many hours').setStyle(TextInputStyle.Short).setRequired(true)),
    );
    return interaction.showModal(modal);
  }

  if (id === 'panel_modperms_reset') {
    setConfig(interaction.guild.id, { modPerms: { roles: {}, muteRoleId: null, banKickLimit: null } });
    const { panelEmbed, panelRows } = require('../commands/modperms-panel');
    return interaction.update({ embeds: [panelEmbed(interaction.guild.id, interaction.user.username)], components: panelRows() });
  }

  if (id === 'panel_modperms_close') {
    return interaction.update({ content: 'Panel closed.', embeds: [], components: [] });
  }
}

async function handleAutorolePanel(interaction, id) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ content: 'You need Manage Roles permission to use this panel.', ephemeral: true });
  }

  if (id === 'panel_autorole_human' || id === 'panel_autorole_bot') {
    const kind = id === 'panel_autorole_human' ? 'human' : 'bot';
    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder().setCustomId(`panel_autorole_${kind}_select:${interaction.message.id}`).setPlaceholder(`Choose a role to add as a ${kind} autorole`),
    );
    return interaction.reply({ content: `Select a role to auto-give to new ${kind === 'human' ? 'members' : 'bots'}:`, components: [row], ephemeral: true });
  }

  if (id === 'panel_autorole_close') {
    return interaction.update({ content: 'Panel closed.', embeds: [], components: [] });
  }
}

async function handleNoPrefixPanel(interaction, id) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: 'You need Manage Server permission to use this panel.', ephemeral: true });
  }

  if (id === 'panel_noprefix_add') {
    const modal = new ModalBuilder().setCustomId(`noprefixmodal_add:${interaction.message.id}`).setTitle('Add No-Prefix User');
    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('userid').setLabel('User ID').setStyle(TextInputStyle.Short).setRequired(true)));
    return interaction.showModal(modal);
  }

  if (id === 'panel_noprefix_remove') {
    const modal = new ModalBuilder().setCustomId(`noprefixmodal_remove:${interaction.message.id}`).setTitle('Remove No-Prefix User');
    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('userid').setLabel('User ID').setStyle(TextInputStyle.Short).setRequired(true)));
    return interaction.showModal(modal);
  }

  if (id === 'panel_noprefix_close') {
    return interaction.update({ content: 'Panel closed.', embeds: [], components: [] });
  }
}

async function handleRoleLockPanel(interaction, id) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: 'You need Administrator permission to use this panel.', ephemeral: true });
  }
  const { getRoleLock } = require('../commands/rolelock');
  const { panelEmbed, panelRow } = require('../commands/rolelock-panel');

  if (id === 'panel_rolelock_enable' || id === 'panel_rolelock_disable') {
    const current = getRoleLock(interaction.guild.id);
    setConfig(interaction.guild.id, { roleLock: { ...current, enabled: id === 'panel_rolelock_enable' } });
  }

  const settings = getRoleLock(interaction.guild.id);
  await interaction.update({ embeds: [panelEmbed(settings)], components: [panelRow()] });
}

// ---------- Help select menu ----------

async function handleSelectMenu(interaction) {
  if (interaction.customId !== 'help_select') return;
  const key = interaction.values[0];
  await interaction.update({ embeds: [categoryEmbed(interaction.client, key)], components: interaction.message.components.map((row, i) => (i === 0 ? selectRow(key) : row)) });
}

// ---------- Giveaway ----------

async function enterGiveaway(interaction, id) {
  const messageId = id.split(':')[1];
  const giveaway = getGiveaway(messageId);
  if (!giveaway || giveaway.ended) {
    return interaction.reply({ content: 'This giveaway has already ended.', ephemeral: true });
  }

  if (giveaway.requiredRoleId && !interaction.member.roles.cache.has(giveaway.requiredRoleId)) {
    return interaction.reply({ content: `You need the <@&${giveaway.requiredRoleId}> role to enter this giveaway.`, ephemeral: true });
  }

  const already = giveaway.participants.includes(interaction.user.id);
  addParticipant(messageId, interaction.user.id);

  if (already) {
    return interaction.reply({ content: "You're already entered!", ephemeral: true });
  }

  await interaction.reply({ content: `🎉 You're entered for **${giveaway.prize}**! Good luck.`, ephemeral: true });

  try {
    const updated = getGiveaway(messageId);
    const host = await interaction.client.users.fetch(updated.hostId).catch(() => null);
    await interaction.message.edit({ embeds: [giveawayEmbed(updated, host, false)] });
  } catch {
    // non-fatal — entry count display will just lag until next entry
  }
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
          type: 'general',
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
      type: 'general',
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

  if (id.startsWith('noprefixmodal_add:') || id.startsWith('noprefixmodal_remove:')) {
    const isAdd = id.startsWith('noprefixmodal_add:');
    const originalMessageId = id.split(':')[1];
    const userId = interaction.fields.getTextInputValue('userid').trim().replace(/[<@!>]/g, '');
    const { getNoPrefixUsers, MAX_USERS, panelEmbed, panelRow } = require('../commands/guildnoprefix');
    const current = getNoPrefixUsers(interaction.guild.id);

    if (isAdd) {
      if (current.includes(userId)) {
        await interaction.reply({ content: 'That user is already on the list.', ephemeral: true });
      } else if (current.length >= MAX_USERS) {
        await interaction.reply({ content: `Limit reached (${MAX_USERS}). Remove someone first.`, ephemeral: true });
      } else {
        setConfig(interaction.guild.id, { noPrefixUsers: [...current, userId] });
        await interaction.reply({ content: `<@${userId}> added.`, ephemeral: true });
      }
    } else {
      setConfig(interaction.guild.id, { noPrefixUsers: current.filter((u) => u !== userId) });
      await interaction.reply({ content: `<@${userId}> removed.`, ephemeral: true });
    }

    try {
      const original = await interaction.channel.messages.fetch(originalMessageId);
      await original.edit({ embeds: [panelEmbed(interaction.guild.id, interaction.user.username)], components: [panelRow()] });
    } catch {
      // panel may have been dismissed already
    }
    return;
  }

  if (id.startsWith('modpermsmodal_limit:')) {
    const originalMessageId = id.split(':')[1];
    const count = parseInt(interaction.fields.getTextInputValue('count'), 10);
    const hours = parseInt(interaction.fields.getTextInputValue('hours'), 10);
    if (!count || !hours) {
      return interaction.reply({ content: 'Both values must be numbers.', ephemeral: true });
    }
    const { getModPermsFull } = require('../commands/modperms');
    const current = getModPermsFull(interaction.guild.id);
    setConfig(interaction.guild.id, { modPerms: { ...current, banKickLimit: { count, hours } } });
    await interaction.reply({ content: `Ban/kick limit set to **${count} per ${hours}h**.`, ephemeral: true });
    const { panelEmbed, panelRows } = require('../commands/modperms-panel');
    try {
      const original = await interaction.channel.messages.fetch(originalMessageId);
      await original.edit({ embeds: [panelEmbed(interaction.guild.id, interaction.user.username)], components: panelRows() });
    } catch {
      // panel may have been dismissed already
    }
    return;
  }

  if (id.startsWith('antinukemodal_trustedowner:')) {
    const originalMessageId = id.split(':')[1];
    const userId = interaction.fields.getTextInputValue('userid').trim();
    const { getAntinuke } = require('../commands/antinuke');
    const current = getAntinuke(interaction.guild.id);
    const trustedOwners = [...new Set([...current.trustedOwners, userId])];
    setConfig(interaction.guild.id, { antinuke: { ...current, trustedOwners } });
    await interaction.reply({ content: `<@${userId}> added as a trusted owner.`, ephemeral: true });
    await refreshAntinukePanel(interaction, originalMessageId);
    return;
  }

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
      topic: `Ticket opened by ${interaction.user.id} | type:${labelSlug} | category:${categoryId}`,
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
    type: 'tickets',
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
      type: 'tickets',
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
    type: 'tickets',
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
    type: 'tickets',
    color: '#ED4245',
    fields: [
      { name: 'Channel', value: `#${interaction.channel.name}` },
      { name: 'Deleted by', value: `${interaction.user.tag}` },
    ],
  });
  setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
}

// ---------- Channel/Role select menus (used by Antinuke panel) ----------

async function handleChannelSelectMenu(interaction) {
  const id = interaction.customId;

  if (id.startsWith('panel_antinuke_logchannel_select:')) {
    const originalMessageId = id.split(':')[1];
    const channel = interaction.channels.first();
    const { getAntinuke } = require('../commands/antinuke');
    const current = getAntinuke(interaction.guild.id);
    setConfig(interaction.guild.id, { antinuke: { ...current, logChannelId: channel.id } });
    await interaction.update({ content: `Log channel set to ${channel}.`, components: [] });
    await refreshAntinukePanel(interaction, originalMessageId);
  }

  if (id.startsWith('panel_mod_logchannel_select:')) {
    const originalMessageId = id.split(':')[1];
    const channel = interaction.channels.first();
    const current = getConfig(interaction.guild.id).logs || {};
    setConfig(interaction.guild.id, { logs: { ...current, mod: channel.id } });
    await interaction.update({ content: `Mod log channel set to ${channel}.`, components: [] });
    const { panelEmbed, panelRows } = require('../commands/moderation-panel');
    try {
      const original = await interaction.channel.messages.fetch(originalMessageId);
      await original.edit({ embeds: [panelEmbed(interaction.guild, interaction.user.username)], components: panelRows() });
    } catch {
      // panel may have been dismissed already
    }
  }

  if (id.startsWith('panel_ticket_closedcategory_select:')) {
    const originalMessageId = id.split(':')[1];
    const category = interaction.channels.first();
    setConfig(interaction.guild.id, { closedCategoryId: category.id });
    await interaction.update({ content: `Closed-ticket category set to ${category}.`, components: [] });
    const { panelEmbed, panelRow } = require('../commands/ticket-config-panel');
    try {
      const original = await interaction.channel.messages.fetch(originalMessageId);
      await original.edit({ embeds: [panelEmbed(interaction.guild.id, interaction.user.username)], components: [panelRow()] });
    } catch {
      // panel may have been dismissed already
    }
  }
}

async function handleRoleSelectMenu(interaction) {
  const id = interaction.customId;

  if (id.startsWith('panel_antinuke_quarantine_select:')) {
    const originalMessageId = id.split(':')[1];
    const role = interaction.roles.first();
    const { getAntinuke } = require('../commands/antinuke');
    const current = getAntinuke(interaction.guild.id);
    setConfig(interaction.guild.id, { antinuke: { ...current, quarantineRoleId: role.id } });
    await interaction.update({ content: `Quarantine role set to ${role}.`, components: [] });
    await refreshAntinukePanel(interaction, originalMessageId);
  }

  if (id.startsWith('panel_modperms_muterole_select:')) {
    const originalMessageId = id.split(':')[1];
    const role = interaction.roles.first();
    const { getModPermsFull } = require('../commands/modperms');
    const current = getModPermsFull(interaction.guild.id);
    setConfig(interaction.guild.id, { modPerms: { ...current, muteRoleId: role.id } });
    await interaction.update({ content: `Mute role set to ${role}.`, components: [] });
    const { panelEmbed, panelRows } = require('../commands/modperms-panel');
    try {
      const original = await interaction.channel.messages.fetch(originalMessageId);
      await original.edit({ embeds: [panelEmbed(interaction.guild.id, interaction.user.username)], components: panelRows() });
    } catch {
      // panel may have been dismissed already
    }
  }

  if (id.startsWith('panel_autorole_human_select:') || id.startsWith('panel_autorole_bot_select:')) {
    const kind = id.startsWith('panel_autorole_human_select:') ? 'human' : 'bot';
    const originalMessageId = id.split(':')[1];
    const role = interaction.roles.first();
    const { getAutoroles } = require('../commands/autorole');
    const current = getAutoroles(interaction.guild.id);
    const key = kind === 'human' ? 'humanRoleIds' : 'botRoleIds';
    const updated = [...new Set([...current[key], role.id])];
    setConfig(interaction.guild.id, { autorole: { ...current, [key]: updated } });
    await interaction.update({ content: `${role} added as a ${kind} autorole.`, components: [] });
    const { panelEmbed, panelRow } = require('../commands/autorole-panel');
    try {
      const original = await interaction.channel.messages.fetch(originalMessageId);
      await original.edit({ embeds: [panelEmbed(interaction.guild.id, interaction.user.username)], components: [panelRow()] });
    } catch {
      // panel may have been dismissed already
    }
  }
}
