const { randomUUID } = require('crypto');

const clients = new Map();

function formatSseEvent(eventName, data) {
  const payload = data === undefined ? {} : data;
  const serialized =
    typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
  return `event: ${eventName}\ndata: ${serialized}\n\n`;
}

function registerClient({ req, res, userId } = {}) {
  const clientId = randomUUID();
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const normalizedUserId = userId ? userId.toString() : null;
  const client = { id: clientId, res, userId: normalizedUserId };
  clients.set(clientId, client);

  const keepAlive = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': keep-alive\n\n');
    }
  }, 30000);

  const removeClient = () => {
    clearInterval(keepAlive);
    clients.delete(clientId);
  };

  req.on('close', removeClient);
  res.on('close', removeClient);
  res.on('error', removeClient);

  res.write(
    formatSseEvent('connected', {
      id: clientId,
      connectedAt: new Date().toISOString(),
    })
  );

  return clientId;
}

function broadcast(eventName, data, options = {}) {
  if (!clients.size) {
    return;
  }

  const { userIds } = options;
  const normalizedUserIds = Array.isArray(userIds)
    ? userIds.map((value) => value && value.toString()).filter(Boolean)
    : null;

  const payload = formatSseEvent(eventName, data);

  clients.forEach((client, clientId) => {
    const { res, userId } = client;

    if (!res || res.writableEnded) {
      clients.delete(clientId);
      return;
    }

    if (normalizedUserIds && normalizedUserIds.length) {
      if (!userId || !normalizedUserIds.includes(userId)) {
        return;
      }
    }

    res.write(payload);
  });
}

function publishEntityChange({
  entity,
  action,
  entityId,
  data,
  triggeredBy,
  userIds,
} = {}) {
  broadcast(
    'entity.change',
    {
      entity,
      action,
      entityId,
      data,
      triggeredBy: triggeredBy ? triggeredBy.toString() : undefined,
      timestamp: new Date().toISOString(),
    },
    { userIds }
  );
}

module.exports = {
  registerClient,
  broadcast,
  publishEntityChange,
};
