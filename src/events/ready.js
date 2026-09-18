module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: '/embed create' }], status: 'online' });
  },
};
