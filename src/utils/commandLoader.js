const fs = require('fs');
const path = require('path');

function clearCache(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) clearCache(fullPath);
    else if (entry.name.endsWith('.js')) delete require.cache[require.resolve(fullPath)];
  }
}

function loadCommands(client, dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(client, fullPath);
    } else if (entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command?.data?.name) client.commands.set(command.data.name, command);
    }
  }
}

module.exports = { loadCommands, clearCache };
