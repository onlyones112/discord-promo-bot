const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const { getDraft, resetDraft, buildEmbed } = require('../utils/embedStore');

function builderRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('embed_title').setLabel('Title/Description').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('embed_color').setLabel('Color').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('embed_author').setLabel('Author').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('embed_field').setLabel('Add Field').setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('embed_footer').setLabel('Footer').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('embed_images').setLabel('Image/Thumbnail').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('embed_reset').setLabel('Reset').setStyle(ButtonStyle.Danger),
  );
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('embed_send').setLabel('Send / Save').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('embed_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger),
  );
  return [row1, row2, row3];
}

module.exports = {
  builderRows,
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Build, edit and send custom embeds')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) => sub.setName('create').setDescription('Open a fresh embed builder in this channel'))
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('Load a message I sent into the builder so you can edit it')
        .addStringOption((opt) => opt.setName('message_id').setDescription('ID of the message to edit').setRequired(true))
        .addChannelOption((opt) =>
          opt.setName('channel').setDescription('Channel the message is in (defaults to this channel)').addChannelTypes(ChannelType.GuildText).setRequired(false),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      resetDraft(interaction.user.id);
      const embed = buildEmbed(getDraft(interaction.user.id));
      await interaction.reply({
        content: 'Embed builder — use the buttons below, then hit **Send / Save**. This will post to the channel you ran the command in.',
        embeds: [embed],
        components: builderRows(),
        ephemeral: true,
      });
      return;
    }

    if (sub === 'edit') {
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      const messageId = interaction.options.getString('message_id');
      try {
        const msg = await channel.messages.fetch(messageId);
        if (msg.author.id !== interaction.client.user.id) {
          return interaction.reply({ content: "I can only load embeds I sent myself.", ephemeral: true });
        }
        const src = msg.embeds[0];
        if (!src) {
          return interaction.reply({ content: 'That message has no embed to edit.', ephemeral: true });
        }
        const d = resetDraft(interaction.user.id);
        d.title = src.title || null;
        d.description = src.description || null;
        d.color = src.hexColor || '#5865F2';
        d.footer = src.footer?.text || null;
        d.footerIcon = src.footer?.iconURL || null;
        d.image = src.image?.url || null;
        d.thumbnail = src.thumbnail?.url || null;
        d.author = src.author?.name || null;
        d.authorIcon = src.author?.iconURL || null;
        d.fields = (src.fields || []).map((f) => ({ name: f.name, value: f.value, inline: f.inline }));
        d.editTarget = { channelId: channel.id, messageId };

        const embed = buildEmbed(d);
        await interaction.reply({
          content: `Loaded message \`${messageId}\` into the builder. Edit and hit **Send / Save** to update it in place.`,
          embeds: [embed],
          components: builderRows(),
          ephemeral: true,
        });
      } catch (err) {
        await interaction.reply({ content: 'Could not find that message (wrong ID/channel, or I did not send it).', ephemeral: true });
      }
    }
  },
};
