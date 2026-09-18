require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

function loadCommandData(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) loadCommandData(fullPath, out);
    else if (entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command?.data) out.push(command.data.toJSON());
    }
  }
  return out;
}

const commands = loadCommandData(path.join(__dirname, 'commands'));
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Deploying ${commands.length} slash commands...`);

    if (process.env.GUILD_ID) {
      // Guild commands update instantly - best for development/single-server bots.
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
      console.log('Deployed commands to guild', process.env.GUILD_ID);
    } else {
      // Global commands can take up to an hour to propagate.
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
      console.log('Deployed commands globally (may take up to 1 hour to show up).');
    }
  } catch (err) {
    console.error(err);
  }
})();
