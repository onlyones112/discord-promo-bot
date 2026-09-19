const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

const BLUE = '#2F80ED';

// Order here = order shown in the dropdown.
const CATEGORIES = {
  antinuke: {
    label: 'Antinuke',
    emoji: '🛡️',
    description: 'Auto-ban on mass channel/role deletion',
    content: '⚔️ » `/antinuke enable|disable`\n🔐 » `/antinuke whitelist-add|whitelist-remove`\n👁️ » `/antinuke view`',
  },
  moderation: {
    label: 'Moderation',
    emoji: '🔨',
    description: 'Kick, ban, timeout, warn, purge, roles, slowmode, lock',
    content:
      '🛡️ » `/kick` `/ban` `/unban` `/timeout`\n' +
      '⚠️ » `/warn add|list|clear`\n' +
      '🧹 » `/purge`\n' +
      '🎭 » `/role add|remove`\n' +
      '🐌 » `/slowmode`\n' +
      '🔒 » `/lock on|off`',
  },
  automod: {
    label: 'AutoMod',
    emoji: '🧠',
    description: 'Auto-filter invites, links, mention spam, images',
    content: '🤖 » `/automod toggle filter:<invites|links|mentions|images> state:<on|off>`\n👁️ » `/automod view`',
  },
  automation: {
    label: 'Automations',
    emoji: '🔗',
    description: 'Autorole on join, reaction roles',
    content: '🎭 » `/autorole set|disable|view` — auto-give a role on join\n📌 » `/reactionrole add|remove|list` — react to a message to get a role',
  },
  autoreactor: {
    label: 'AutoReactor',
    emoji: '💬',
    description: 'Bot auto-reacts to every message in a channel',
    content: '💬 » `/autoreact add|remove|list` — bot reacts automatically to every message posted in a chosen channel',
  },
  tickets: {
    label: 'Ticket',
    emoji: '🎫',
    description: 'Multi-category ticket panels and archiving',
    content:
      '🎫 » `/ticket-panel` — post a ticket button for one category (run once per type: Support, Buy/Sell, etc.)\n' +
      '⚙️ » `/ticket-config set-closed-category` — where closed tickets get archived instead of deleted',
  },
  logging: {
    label: 'Logging',
    emoji: '📁',
    description: 'Separate channels per log type: mod, join/leave, roles, voice, tickets, antinuke',
    content: '📁 » `/setlogs auto` — auto-create a full set of log channels (mod, join/leave, roles, voice, tickets, antinuke, general)\n⚙️ » `/setlogs set|view|disable`',
  },
  welcomer: {
    label: 'Welcomer',
    emoji: '👋',
    description: 'Welcome, boost & greet messages',
    underDevelopment: true,
  },
  utility: {
    label: 'Utility',
    emoji: '🔧',
    description: 'Info commands and announcements',
    content: '👤 » `/userinfo` `/avatar`\n🏠 » `/serverinfo`\n📣 » `/announce`\n📊 » `/poll`',
  },
  music: {
    label: 'Music',
    emoji: '🎵',
    description: 'Voice channel music playback',
    underDevelopment: true,
  },
  giveaways: {
    label: 'Giveaway',
    emoji: '🎁',
    description: 'Start, end, reroll, and list giveaways',
    content: '🎉 » `/giveaway start prize: duration: winners: required_role:`\n🏁 » `/giveaway end` `/giveaway reroll` `/giveaway list`',
  },
  social: {
    label: 'Social',
    emoji: '⭐',
    description: 'Reputation, profiles, and hug/slap/kiss-style actions',
    content:
      '⭐ » `/social rep` `/social profile` `/social bio`\n' +
      '🎭 » `/fun action:<hug|slap|kiss|pat|cuddle|poke|highfive|bonk|wink|sorry|cry|happy|blush|dance> user:`',
  },
  j2c: {
    label: 'Join2Create',
    emoji: '🔊',
    description: 'Dynamic voice channels — Solo, Duo or Unlimited',
    content: '🔊 » `/j2c setup category: type:<solo|duo|unlimited>`\n🗑️ » `/j2c remove` `/j2c list`',
  },
  embeds: {
    label: 'Embeds',
    emoji: '📝',
    description: 'Button-driven embed builder',
    content: '📝 » `/embed create` — build and send a custom embed\n✏️ » `/embed edit` — edit an embed I already sent',
  },
  dmpromo: {
    label: 'DM Promo',
    emoji: '📢',
    description: 'Broadcast DMs to members, a role, or specific users',
    content: '📢 » `/dm-promo all|role|users` — broadcast a DM announcement',
  },
  management: {
    label: 'Bot Management',
    emoji: '⚙️',
    description: 'Restart, reload commands, and text-prefix setup',
    content:
      '🔄 » `/restart` — restart the bot process (Admin only)\n' +
      '♻️ » `/reload` — reload command files and sync with Discord instantly, no restart needed (Admin only)\n' +
      '💬 » `/setprefix set|disable|view` — turn on text commands like `!help`, `!ping` alongside slash commands',
  },
};

function mainEmbed(client) {
  const commandCount = client.commands.size;
  return new EmbedBuilder()
    .setColor(BLUE)
    .setTitle(`${client.user.username} Help`)
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setDescription(`🛡️ Hello! I'm **${client.user.username}** — moderation, tickets, giveaways, promo and more.`)
    .addFields({
      name: '\u200B',
      value: `🔹 **Commands:** ${commandCount}\n🔹 Choose a specific module from the dropdown below`,
    });
}

function categoryEmbed(client, key) {
  const cat = CATEGORIES[key];
  const embed = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle(`${cat.emoji} ${cat.label}`)
    .setFooter({ text: `${client.user.username} — pick another module below` });

  if (cat.underDevelopment) {
    embed.setDescription('🚧 **Under Development**\n\nThis module is coming soon — check back later!');
  } else {
    embed.setDescription(cat.content);
  }

  return embed;
}

function selectRow(selected) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('help_select')
    .setPlaceholder('↳ Select a Module From Here')
    .addOptions(
      Object.entries(CATEGORIES).map(([value, cat]) => ({
        label: cat.label,
        description: cat.description,
        value,
        emoji: cat.emoji,
        default: value === selected,
      })),
    );
  return new ActionRowBuilder().addComponents(menu);
}

function linkRow() {
  const buttons = [];
  if (process.env.CLIENT_ID) {
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;
    buttons.push(new ButtonBuilder().setLabel('Invite Me').setStyle(ButtonStyle.Link).setURL(inviteUrl).setEmoji('🔗'));
  }
  if (process.env.SUPPORT_SERVER_URL) {
    buttons.push(new ButtonBuilder().setLabel('Support').setStyle(ButtonStyle.Link).setURL(process.env.SUPPORT_SERVER_URL).setEmoji('🎧'));
  }
  if (process.env.GUIDE_URL) {
    buttons.push(new ButtonBuilder().setLabel('Guide').setStyle(ButtonStyle.Link).setURL(process.env.GUIDE_URL).setEmoji('📘'));
  }
  return buttons.length ? new ActionRowBuilder().addComponents(...buttons) : null;
}

module.exports = {
  CATEGORIES,
  mainEmbed,
  categoryEmbed,
  selectRow,

  data: new SlashCommandBuilder().setName('help').setDescription('Show everything this bot can do'),

  async execute(interaction) {
    const rows = [selectRow(null)];
    const link = linkRow();
    if (link) rows.push(link);

    await interaction.reply({ embeds: [mainEmbed(interaction.client)], components: rows });
  },
};
