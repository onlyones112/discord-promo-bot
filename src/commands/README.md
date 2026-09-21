# Discord Promo Bot

High-utility Discord bot with:
- **Embed builder** — `/embed create` and `/embed edit`, button-driven, no coding needed to make a nice embed
- **Moderation** — `/kick`, `/ban`, `/unban`, `/timeout`, `/warn add|list|clear`, `/purge`, `/role add|remove`, `/slowmode`, `/lock`/`/unlock`
- **Ticket system** — `/ticket-panel` per category (Support, Buy/Sell, etc.), closed tickets auto-move to an archive category instead of being deleted
- **DM promo** — `/dm-promo all`, `/dm-promo role`, `/dm-promo users` to broadcast a DM to your members
- **Logging** — `/setlogs auto` creates its own private log category+channel; every action above gets posted there automatically
- **Help menu** — `/help` shows an interactive, blue embed with a dropdown to browse categories, plus Invite/Support/Guide buttons
- **Utility** — `/userinfo`, `/serverinfo`, `/avatar`, `/announce`, `/poll`
- **Giveaways** — `/giveaway start|end|reroll|list`, button-based entry, optional required-role, gold-themed embed, auto-picks winners when the timer runs out
- **Bot Management** — `/restart` restarts the process, `/reload` reloads command files and re-syncs with Discord **without a restart**
- **Text prefix commands** — `/setprefix set prefix:!` turns on `!help`/`!ping` etc. alongside slash commands (off by default)
- **Join2Create** — `/j2c setup` makes a voice hub; joining it spawns a personal channel (Solo = 1 person, Duo = 2, Unlimited), auto-deleted when empty
- **Social** — `/social rep`, `/social profile`, `/social bio` — a light reputation/profile system
- **AutoMod** — `/automod toggle` filters Discord invites, links, mention spam, or images automatically (staff bypass)
- **Antinuke** — `/antinuke enable` auto-bans anyone (not whitelisted/owner) who deletes 3+ channels or roles in 10 seconds
- **RoleLock** — `/rolelock add role:@X` protects a role; anyone not on the trusted list who adds/removes it gets auto-reverted
- **ModPerms** — `/modperms grant role:@Role command:kick` gives a role access to a specific moderation command without native Discord permissions; includes a ban/kick rate limit
- **Multi-panel Tickets** — up to 3 `/ticket-panel`s per server, managed with `/ticket-panels list|remove`
- **Autorole Dashboard** — separate role lists for humans vs bots (`/autorole humans-add`, `/autorole bots-add`), plus `/autorole-panel`
- **No-prefix mode & bot nickname** — `/guildnoprefix enable` lets `help`/`ping` work with zero prefix; `/guildbotprofile nickname` sets my nickname per-server
- **Interactive panels** — `/antinuke-panel` (full config: trusted owners, punishment type, log channel, quarantine role — all via buttons/select-menus), `/automod-panel`, `/moderation-panel`, `/ticket-config-panel`, `/rolelock-panel`, `/modperms-panel`, `/autorole-panel`
- **Fun/Roleplay** — `/fun action:hug|slap|kiss|pat|cuddle|poke|highfive|bonk|wink|sorry|cry|happy|blush|dance user:<optional>`
- **Automation** — `/autorole` (auto-give a role on join), `/reactionrole` (react to a message → get a role), `/autoreact` (bot auto-reacts to every message in a channel)
- **Multi-channel logging** — separate channels for mod actions, join/leave, role changes, voice activity, tickets, and antinuke — all set up in one command

## 1. Create the bot application

1. Go to https://discord.com/developers/applications → **New Application**.
2. Go to the **Bot** tab → **Reset Token** → copy it. This is your `DISCORD_TOKEN`.
3. On the same Bot tab, turn ON these **Privileged Gateway Intents**:
   - Server Members Intent (required for moderation + DM promo)
   - **Message Content Intent** (required for AutoMod to read message text)

You'll also need **Node.js 18 or newer** on whatever you deploy to (Replit/Railway both give you this by default) — the `/fun` command uses the browser-standard `fetch()` which needs it.
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

Run `/setlogs auto` once — the bot creates its own hidden **📁 Bot Logs** category with **7 separate channels** inside it (general, mod, join-leave, roles, voice, tickets, antinuke), all hidden from everyone except admins. Every action is routed to the right one automatically: kicks/bans/warns/purges/role-changes/lock/slowmode → mod-logs; joins/leaves → join-leave-logs; role additions/removals on members → role-logs; VC activity → voice-logs; ticket open/close/delete → ticket-logs; antinuke bans → antinuke-logs; everything else (embeds, DM promo, giveaways) → general-logs.

Prefer to point a type at a channel you already have? `/setlogs set type:<mod|joinleave|roles|voice|tickets|antinuke|general> channel:#your-channel`. `/setlogs view` shows what's set where, `/setlogs disable` turns one type (or everything) off.

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

## New features

- **Giveaways**: `/giveaway start prize:"Nitro" duration:1h winners:1 required_role:@Member` posts a gold-themed embed with an **Enter Giveaway** button (required_role is optional — leave it out to let anyone enter). It ends itself automatically (checked every 30s), picks random winner(s) from everyone who clicked Enter, and announces them with a mention. `/giveaway end message_id:<id>` ends one early; `/giveaway reroll message_id:<id>` picks a new winner after it's ended; `/giveaway list` shows everything currently running.

- **Restart & Reload**: `/restart` cleanly restarts the whole bot process — use this after pulling in a change that needs a fresh start (e.g. a new npm package, or an env variable change). `/reload` is lighter and faster: it re-reads every file in `src/commands/` and re-syncs them with Discord **without restarting anything** — use this after adding/editing a command file so it goes live in seconds instead of waiting for a redeploy. Both need Administrator permission.

  ⚠️ One important note: `/reload` only re-reads existing files — if you **added a brand-new command file**, you still need to get that file onto the server first (re-upload to GitHub + Railway redeploy, or edit directly if you have terminal access), *then* run `/reload` so it's registered without a full restart. `/reload` can't invent a file that isn't there yet.

- **Text prefix commands**: off by default (slash-only). Turn it on with `/setprefix set prefix:!` (any short symbol/word works) — this adds `!help` and `!ping` as text commands alongside the slash versions. `/setprefix disable` turns it back off, `/setprefix view` shows the current one.

- **Join2Create**: first make a category for it, then `/j2c setup category:<category> type:solo` (or `duo` / `unlimited`) — this creates one "hub" voice channel. Anyone who joins that hub instantly gets their own new voice channel (with a user limit matching the type) and gets moved into it automatically; it's deleted the moment it's empty again. Run `/j2c setup` again with a different `type` to offer multiple hubs (e.g. one Solo hub and one Duo hub side by side). `/j2c list` shows what's configured, `/j2c remove` unlinks a hub (doesn't delete the channel itself).

- **Social**: `/social rep @user` gives them a reputation point (12h cooldown per giver, can't rep yourself), `/social profile` shows rep + bio, `/social bio text:"..."` sets your own bio.

- **AutoMod**: `/automod toggle filter:<invites|links|mentions|images> state:on` turns a filter on. Anyone with Manage Messages is never filtered (so staff can always post freely). Violating messages are deleted with a short warning that auto-removes itself.

- **Antinuke**: `/antinuke enable` turns it on. If a non-whitelisted, non-owner member deletes 3+ channels or 3+ roles within 10 seconds, they're automatically banned and it's logged. Add trusted co-admins with `/antinuke whitelist-add user:@Name` so they're never caught by it.

- **RoleLock**: `/rolelock add role:@Staff` protects that role. From then on, if anyone who isn't the server owner or on the trusted list (`/rolelock trusted-add user:@Name`) adds or removes that role from someone, the bot reverts it automatically and logs it. Good for protecting high-permission roles from a compromised or malicious mod account.

- **Interactive panels**: instead of remembering subcommand names, `/antinuke-panel`, `/automod-panel`, `/moderation-panel`, and `/rolelock-panel` post an embed with buttons — Enable/Disable, toggle each AutoMod filter, or quick Lock/Unlock/Purge for the current channel. Anyone using the buttons still needs the same permission the equivalent slash command requires.

- **Fun/Roleplay**: `/fun action:hug user:@Friend` posts a reaction gif + message. Targeted actions (hug, slap, kiss, pat, cuddle, poke, highfive, bonk, wink, sorry) need a `user`; solo actions (cry, happy, blush, dance) don't. Images come from the free waifu.pics API.

- **Autorole**: `/autorole set role:@Member` — every new member gets that role instantly on join.

- **Reaction Roles**: post any message first (an `/embed create` works great for this), copy its message ID, then `/reactionrole add message_id:<id> emoji:🎮 role:@Gamer`. The bot adds that reaction itself; anyone who clicks it gets the role, removing their reaction takes it away. `/reactionrole list message_id:<id>` shows what's linked.

- **Auto-react**: `/autoreact add channel:#suggestions emoji:👍` — the bot reacts to every single message posted in that channel automatically. Good for suggestion/feedback channels.

## Extending it

- Warnings are stored in `warnings.json`, log/AutoMod/Antinuke config in `guildConfig.json`, giveaways in `giveaways.json`, Join2Create hubs in `j2c.json`, and rep/bios in `social.json` — all in the project root, auto-created on first use. Swap for a real DB if you ever run multiple bot instances at once.
- Embed drafts are in-memory (`src/utils/embedStore.js`) — they reset if the bot restarts mid-edit.
- Antinuke's burst-detection counters are in-memory too (reset on restart) — fine, since a nuke attempt is a burst that happens in seconds, not something that needs to survive a restart.

## Making changes yourself later

The whole bot is just plain files — you don't need my help for small tweaks. Here's how the pieces fit together so future changes are easy:

- **Every command is its own file.** Want to tweak what `/kick` says or does? Open `src/commands/moderation/kick.js`, edit it, save. New commands just need a new `.js` file dropped into `src/commands/` (or its `moderation`/`utility` subfolders) — the bot auto-loads every file in there on startup, no registration code to touch.
- **Buttons, select menus and modals are handled in one place**: `src/events/interactionCreate.js`. If you add a new button to a command, its click handler goes here (search for `customId.startsWith` to see the pattern used).
- **Background behavior (not tied to a slash command) lives in `src/events/`** — one file per Discord event. `messageCreate.js` is AutoMod, `voiceStateUpdate.js` is Join2Create, `channelDelete.js`/`roleDelete.js` are Antinuke, `ready.js` runs on startup (the giveaway timer lives here).
- **Anything that needs to remember something between restarts** goes through a small store file in `src/utils/` (e.g. `giveawayStore.js`, `j2cStore.js`) — each one just reads/writes a JSON file. Copy the pattern for a new feature that needs its own memory.
- **Adding a new prefix command**: open `src/events/prefixCommands.js` and add a new entry to the `PREFIX_COMMANDS` object — same idea as adding a new slash command, just simpler (no options schema, just parse `args` yourself).
- **After any change**: save the file, then on your host run `npm run deploy` again *only if* you changed a command's name/options (added a new slash command, renamed an option, etc.) — for logic-only changes inside an existing command, `npm start` (or a redeploy on Railway) is enough, since the command's shape on Discord's side hasn't changed.
- **On Railway**: after editing a file locally, push the change to your GitHub repo (edit directly on github.com works fine for small edits, or re-upload the changed file the same way you did the first time), then hit **Redeploy** in the Railway dashboard — it pulls the latest code automatically.

If you ever want a new feature built out (like these ones were), just describe it the same way you did here and it can be added the same way — new files get created, existing ones get small additions, and nothing that already works gets touched.
