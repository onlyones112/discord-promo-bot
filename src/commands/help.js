const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

const BLUE = '#2F80ED';
const FOOTER = 'Developed by only_abdul69';

// group: which section this shows under in the main embed.
// Order of keys here = order shown in both the main embed and the dropdown.
const CATEGORIES = {
  antinuke: {
    label: 'Antinuke',
    emoji: '🛡️',
    group: 'Security Modules',
    description: 'Auto-punish mass channel/role deletion, with quarantine role support',
    content:
      '⚔️ » `/antinuke enable|disable`\n' +
      '🔐 » `/antinuke trustedowner-add|trustedowner-remove`\n' +
      '⚖️ » `/antinuke punishment type:<ban|kick|timeout>`\n' +
      '📁 » `/antinuke logchannel`\n' +
      '🧱 » `/antinuke quarantine-role` `/antinuke backup-quarantine-role`\n' +
      '👁️ » `/antinuke view`\n' +
      '🎛️ » `/antinuke-panel` — full interactive control panel',
  },
  moderation: {
    label: 'Moderation',
    emoji: '🔨',
    group: 'Security Modules',
    description: 'Kick, ban, timeout, warn, purge, roles, slowmode, lock',
    content:
      '🛡️ » `/kick` `/ban` `/unban` `/timeout`\n' +
      '⚠️ » `/warn add|list|clear`\n' +
      '🧹 » `/purge`\n' +
      '🎭 » `/role add|remove`\n' +
      '🐌 » `/slowmode`\n' +
      '🔒 » `/lock on|off`\n' +
      '👁️ » `/hide` `/hideall` `/unhide` `/unhideall`\n' +
      '💥 » `/nuke` `/hackban` `/unbanall`\n' +
      '🎛️ » `/moderation-panel` — quick lock/unlock/purge + mod log setup',
  },
  automod: {
    label: 'AutoMod',
    emoji: '🧠',
    group: 'Security Modules',
    description: 'Auto-filter invites, links, mention spam, images',
    content: '🤖 » `/automod toggle filter:<invites|links|mentions|images> state:<on|off>`\n👁️ » `/automod view`\n🎛️ » `/automod-panel` — interactive control panel',
  },
  logging: {
    label: 'Logging',
    emoji: '📁',
    group: 'Security Modules',
    description: 'Separate channels per log type: mod, join/leave, roles, voice, tickets, antinuke',
    content: '📁 » `/setlogs auto` — auto-create a full set of log channels (mod, join/leave, roles, voice, tickets, antinuke, general)\n⚙️ » `/setlogs set|view|disable`',
  },
  rolelock: {
    label: 'RoleLock',
    emoji: '🔐',
    group: 'Security Modules',
    description: 'Protect specific roles from unauthorized add/remove',
    content:
      '🔐 » `/rolelock enable|disable`\n' +
      '➕ » `/rolelock add|remove` — protect/unprotect a role\n' +
      '✅ » `/rolelock trusted-add|trusted-remove` — who can bypass\n' +
      '📋 » `/rolelock list` `/rolelock trusted-list` `/rolelock status`\n' +
      '🎛️ » `/rolelock-panel` — interactive control panel',
  },
  modperms: {
    label: 'ModPerms',
    emoji: '🔨',
    group: 'Security Modules',
    description: 'Grant specific roles access to moderation commands, plus ban/kick limits',
    content:
      '✅ » `/modperms grant|revoke` — give/remove a role access to a specific mod command\n' +
      '📋 » `/modperms list` — see all grants\n' +
      '🔇 » `/modperms set-mute-role`\n' +
      '⚖️ » `/modperms set-bankick-limit|clear-bankick-limit`\n' +
      '👁️ » `/modperms view` — see which commands YOU can run\n' +
      '🎛️ » `/modperms-panel` — interactive version',
  },
  automation: {
    label: 'Self Role',
    emoji: '🔗',
    group: 'Automation Modules',
    description: 'Autorole, reaction roles, and personal custom roles',
    content:
      '🎭 » `/autorole humans-add|humans-remove` — auto-give a role to new human members\n' +
      '🤖 » `/autorole bots-add|bots-remove` — auto-give a role to new bots\n' +
      '📋 » `/autorole config|reset`\n' +
      '🎛️ » `/autorole-panel` — dashboard for both\n' +
      '📌 » `/reactionrole add|remove|list` — react to a message to get a role\n' +
      '🎨 » `/customrole create|rename|color|delete` — your own personal role\n' +
      '⚙️ » `/customrole reqrole|logschannel|list|config|reset` — admin config',
  },
  autoreactor: {
    label: 'AutoReactor',
    emoji: '💬',
    group: 'Automation Modules',
    description: 'Bot auto-reacts to every message in a channel',
    content: '💬 » `/autoreact add|remove|list` — bot reacts automatically to every message posted in a chosen channel',
  },
  management: {
    label: 'Bot Management',
    emoji: '⚙️',
    group: 'Automation Modules',
    description: 'Restart, reload commands, and text-prefix setup',
    content:
      '🔄 » `/restart` — restart the bot process (Admin only)\n' +
      '♻️ » `/reload` — reload command files and sync with Discord instantly, no restart needed (Admin only)\n' +
      '💬 » `/setprefix set|disable|view` — turn on text commands like `!help`, `!ping` alongside slash commands\n' +
      '🚫 » `/guildnoprefix` — just run it bare to open the panel; or `action:add|remove|list user:@X` to skip straight to it\n' +
      '🪪 » `/guildbotprofile nickname|reset-nickname|view` — customize my nickname in this server',
  },
  tickets: {
    label: 'Ticket',
    emoji: '🎫',
    group: 'Extra Modules',
    description: 'Multi-category ticket panels and archiving',
    content:
      '🎫 » `/ticket-panel` — post a ticket button for one category (up to 3 per server)\n' +
      '📋 » `/ticket-panels list|remove` — manage your configured panels\n' +
      '⚙️ » `/ticket-config set-closed-category` — where closed tickets get archived instead of deleted\n' +
      '🎛️ » `/ticket-config-panel` `/ticketsetup` — interactive setup\n' +
      '👥 » `/adduser` `/removeuser` — inside a ticket, add/remove access\n' +
      '🔧 » `/closeticket` `/reopenticket` `/deleteticket` `/renameticket` `/showticket` — inside a ticket',
  },
  j2c: {
    label: 'Join2Create',
    emoji: '🔊',
    group: 'Extra Modules',
    description: 'Dynamic voice channels — Solo, Duo or Unlimited',
    content: '🔊 » `/j2c setup category: type:<solo|duo|unlimited>`\n🗑️ » `/j2c remove` `/j2c list`',
  },
  giveaways: {
    label: 'Giveaway',
    emoji: '🎁',
    group: 'Extra Modules',
    description: 'Start, end, reroll, and list giveaways',
    content: '🎉 » `/giveaway start prize: duration: winners: required_role:`\n🏁 » `/giveaway end` `/giveaway reroll` `/giveaway list`',
  },
  social: {
    label: 'Social',
    emoji: '⭐',
    group: 'Extra Modules',
    description: 'Reputation, profiles, and hug/slap/kiss-style actions',
    content:
      '⭐ » `/social rep` `/social profile` `/social bio`\n' +
      '🎭 » `/fun action:<hug|slap|kiss|pat|cuddle|poke|highfive|bonk|wink|sorry|cry|happy|blush|dance> user:`',
  },
  welcomer: {
    label: 'Welcomer',
    emoji: '👋',
    group: 'Extra Modules',
    description: 'Welcome, boost & greet messages',
    underDevelopment: true,
  },
  music: {
    label: 'Music',
    emoji: '🎵',
    group: 'Extra Modules',
    description: 'Voice channel music playback',
    underDevelopment: true,
  },
  utility: {
    label: 'Utility',
    emoji: '🔧',
    group: 'Extra Modules',
    description: 'Info commands, announcements, AFK, timers, and server stats',
    content:
      '👤 » `/userinfo` `/avatar`\n' +
      '🏠 » `/serverinfo`\n' +
      '📣 » `/announce`\n' +
      '📊 » `/poll`\n' +
      '💤 » `/afk`\n' +
      '⏱️ » `/timer`\n' +
      '📈 » `/serverstats` `/stats` `/serveraudit`\n' +
      '📋 » `/listadmins` `/listbans` `/listroles` `/listinroles` `/listbot` `/listjoinpos` `/boosterlist` `/oldmember` `/listaudits`',
  },
  embeds: {
    label: 'Embeds',
    emoji: '📝',
    group: 'Extra Modules',
    description: 'Button-driven embed builder',
    content: '📝 » `/embed create` — build and send a custom embed\n✏️ » `/embed edit` — edit an embed I already sent',
  },
  dmpromo: {
    label: 'DM Promo',
    emoji: '📢',
    group: 'Extra Modules',
    description: 'Broadcast DMs to members, a role, or specific users',
    content: '📢 » `/dm-promo all|role|users` — broadcast a DM announcement',
  },
};

const GROUP_ORDER = ['Security Modules', 'Automation Modules', 'Extra Modules'];

function mainEmbed(client) {
  const commandCount = client.commands.size;
  const embed = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle(`${client.user.username} Help`)
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setDescription(`🛡️ Hello! I'm **${client.user.username}**, your server's all-in-one bot.`)
    .addFields({
      name: '\u200B',
      value: `🔹 **Commands:** ${commandCount}\n🔹 **Use:** Select a module from the dropdown below`,
    });

  for (const group of GROUP_ORDER) {
    const entries = Object.values(CATEGORIES).filter((c) => c.group === group);
    embed.addFields({
      name: group,
      value: entries.map((c) => `${c.emoji} » ${c.label}`).join('\n'),
    });
  }

  embed.setFooter({ text: FOOTER });
  return embed;
}

function categoryEmbed(client, key) {
  const cat = CATEGORIES[key];
  const embed = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle(`${cat.emoji} ${cat.label}`)
    .setFooter({ text: FOOTER });

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
