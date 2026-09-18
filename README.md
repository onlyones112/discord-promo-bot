# Discord Promo Bot

High-utility Discord bot with:
- **Embed builder** — `/embed create` and `/embed edit`, button-driven, no coding needed to make a nice embed
- **Moderation** — `/kick`, `/ban`, `/unban`, `/timeout`, `/warn add|list|clear`, `/purge`, `/role add|remove`, `/slowmode`, `/lock`/`/unlock`
- **Ticket system** — `/ticket-panel` per category (Support, Buy/Sell, etc.), closed tickets auto-move to an archive category instead of being deleted
- **DM promo** — `/dm-promo all`, `/dm-promo role`, `/dm-promo users` to broadcast a DM to your members
- **Logging** — `/setlogs auto` creates its own private log category+channel; every action above gets posted there automatically
- **Help menu** — `/help` shows a categorized, blue embed of every command with Invite/Support/Guide buttons
- **Utility** — `/userinfo`, `/serverinfo`, `/avatar`, `/announce`, `/poll`

## 1. Create the bot application

1. Go to https://discord.com/developers/applications → **New Application**.
2. Go to the **Bot** tab → **Reset Token** → copy it. This is your `DISCORD_TOKEN`.
3. On the same Bot tab, turn ON these **Privileged Gateway Intents**:
   - Server Members Intent (required for moderation + DM promo)
4. Go to **OAuth2 → General** → copy the **Client ID**. This is your `CLIENT_ID`.
5. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: Administrator (simplest), or at minimum: Manage Channels, Manage Messages, Kick Members, Ban Members, Moderate Members, Send Messages, Embed Links, Read Message History
   - Copy the generated URL, open it, and invite the bot to your server.

## 2. Get your server ID

Turn on Developer Mode: Discord Settings → Advanced → Developer Mode.
Then right-click your server icon → Copy Server ID → this is `GUILD_ID`.

You do **not** need to put ticket categories or a support role in `.env` anymore — those are now set per ticket-type directly through Discord (see "Tickets" below), which is what lets you run multiple ticket types (Support, Buy/Sell, etc.) each going to their own category.

## 3. Configure

```bash
cd discord-promo-bot
npm install
cp .env.example .env
```

Open `.env` and fill in the values you collected above.

## 4. Register slash commands & start the bot

```bash
npm run deploy   # registers /embed, /kick, /ban, /ticket-panel, /dm-promo, etc.
npm start        # logs the bot in
```

Guild commands (when `GUILD_ID` is set) show up instantly. Global commands (no `GUILD_ID`) can take up to an hour.

## Set up logging (do this first)

Run `/setlogs auto` once — the bot creates its own hidden **📁 Bot Logs** category and a `#bot-logs` channel inside it (only admins can see it) and starts using it immediately. Prefer an existing channel instead? Use `/setlogs set channel:#your-channel`. From then on, every kick/ban/timeout/warn/purge/role change/slowmode/lock, every DM promo run (with sent/failed counts), every ticket opened/closed/deleted, and every embed sent or edited gets posted there automatically. `/setlogs view` shows the current channel, `/setlogs disable` turns it off.

## Using it

- **Embed builder**: run `/embed create` in the channel you want to post to. Buttons let you set title/description, color, author, footer, image/thumbnail, and add fields. Hit **Send / Save**. To edit a message the bot already sent, use `/embed edit message_id:<id>`.

- **Tickets (multiple categories)**: create your categories in Discord first (e.g. "🎫 Support Tickets", "💰 Buy/Sell Tickets", "🔒 Closed Tickets"). Then:
  1. `/ticket-config set-closed-category category:🔒 Closed Tickets` — closed tickets get *moved here* instead of deleted, so nothing is lost.
  2. Run `/ticket-panel` once **per ticket type**, e.g.:
     - `/ticket-panel category:🎫 Support Tickets label:Support role:@Support`
     - `/ticket-panel category:💰 Buy/Sell Tickets label:Buy/Sell role:@Sales`
     
     Each panel posts its own button; clicking it creates a channel under *that* panel's category and pings *that* panel's role (role is optional).
  3. When staff hits **Close Ticket**, the channel moves into your closed category, gets renamed `closed-...`, and the ticket opener loses send access (so it's kept as a record, not deleted). A **Delete Permanently** button appears for staff (needs Manage Channels) if you want to remove it for good later.
  4. If you skip step 1, closing a ticket falls back to the old behavior: it just deletes after 5 seconds.

- **Moderation**: `/kick`, `/ban`, `/timeout`, `/warn add|list|clear`, `/purge` — each is permission-gated (e.g. `/ban` needs Ban Members) so random members can't run them even if they can see the commands.
- **DM promo**: `/dm-promo all message:"..."` DMs every non-bot member; `/dm-promo role role:@Name message:"..."` targets a role; `/dm-promo users users:"@user1 @user2" message:"..."` targets specific people. There's a small delay between sends to avoid rate limits, and it reports how many succeeded vs failed (some users just have DMs off).

## A quick heads-up on DM promo

Discord's ToS frowns on unsolicited mass-DMing users who haven't opted in — this is meant for your own server's members who'd reasonably expect updates from a community they joined (announcements, event pings, etc.), not for DMing people outside your server or anyone who's asked not to be contacted. Keep volume reasonable and you should be fine.

## Extending it

- Warnings are stored in `warnings.json`, log channel config in `guildConfig.json` — both in the project root (auto-created). Swap for a real DB if you need it across multiple bot instances.
- Embed drafts are in-memory (`src/utils/embedStore.js`) — they reset if the bot restarts mid-edit.
- Add more commands by dropping new files in `src/commands/`, `src/commands/moderation/`, or `src/commands/utility/` — they're all auto-loaded. Call `logAction(interaction.guild, {...})` from `src/utils/logger.js` in any new command to get it logged automatically.
