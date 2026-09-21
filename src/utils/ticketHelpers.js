function isTicketChannel(channel) {
  return !!channel.topic && channel.topic.startsWith('Ticket opened by');
}

function parseTicketTopic(topic) {
  if (!topic) return null;
  const ownerMatch = topic.match(/Ticket opened by (\d+)/);
  const typeMatch = topic.match(/type:([^\s|]+)/);
  const categoryMatch = topic.match(/category:(\d+)/);
  if (!ownerMatch) return null;
  return {
    ownerId: ownerMatch[1],
    type: typeMatch ? typeMatch[1] : null,
    originalCategoryId: categoryMatch ? categoryMatch[1] : null,
  };
}

module.exports = { isTicketChannel, parseTicketTopic };
