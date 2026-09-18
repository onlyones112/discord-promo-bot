const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const BLUE = '#2F80ED';

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show everything this bot can do'),

  async execute(interaction) {
    const client = interaction.client;
    const botName = client.user.username;
    const commandCount = client.commands.size;

    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle(`${botName} Help`)
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .setDescription(`🛡️ Hello! I'm **${botName}** — embeds, tickets, moderation and promo tools for your server.`)
      .addFields(
        { name: '\u200B', value: `🔹 **Prefix:** Slash commands (\`/\`)\n🔹 **Commands:** ${commandCount}\n🔹 **Use:** \`/help\` any time to see this again` },
        {
          name: '__Moderation__',
          value:
            '🛡️ » `/kick` `/ban` `/unban` `/timeout`\n' +
            '⚠️ » `/warn add|list|clear`\n' +
            '🧹 » `/purge`\n' +
            '🎭 » `/role add|remove`\n' +
            '🐌 » `/slowmode`\n' +
            '🔒 » `/lock` `/unlock`',
        },
        {
          name: '__Tickets__',
          value:
            '🎫 » `/ticket-panel` — post a ticket button for a category (run once per type: Support, Buy/Sell, etc.)\n' +
            '⚙️ » `/ticket-config` — set the closed-ticket archive category',
        },
        {
          name: '__DM Promo__',
          value: '📢 » `/dm-promo all|role|users` — broadcast a DM announcement to your members',
        },
        {
          name: '__Embeds__',
          value: '📝 » `/embed create` — button-driven embed builder\n✏️ » `/embed edit` — edit an embed I already sent',
        },
        {
          name: '__Utility__',
          value:
            '👤 » `/userinfo` `/avatar`\n' +
            '🏠 » `/serverinfo`\n' +
            '📣 » `/announce`\n' +
            '📊 » `/poll`',
        },
        {
          name: '__Logging__',
          value: '📁 » `/setlogs auto` — auto-create a private log channel, or `/setlogs set` to pick your own',
        },
      )
      .setFooter({ text: `${botName} — built with discord.js` });

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

    const components = buttons.length ? [new ActionRowBuilder().addComponents(...buttons)] : [];

    await interaction.reply({ embeds: [embed], components });
  },
};
