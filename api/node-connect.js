// Omnitrix Portal - Backend Connection Endpoint
// Serves the omnidirectional node connection, keeps channel active.
// Only this file is needed on GitHub for the node to connect to.

export default async function handler(req, res) {
  // CORS for cross-origin node connections
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Agent-Tag, X-Connection-ID, X-Node-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { query, method } = req;
  const agentTag = req.headers['x-agent-tag'] || 'omnitrix-node';
  const connectionId = req.headers['x-connection-id'] || 'conn-' + Math.random().toString(16).slice(2, 10);
  const nodeType = req.headers['x-node-type'] || 'omnidirectional';

  // Health / handshake endpoint
  if (method === 'GET' && query.action === 'handshake') {
    res.status(200).json({
      ok: true,
      action: 'handshake',
      agentTag,
      connectionId,
      nodeType,
      endpoint: '/api/node-connect',
      protocol: 'omnidirectional-v1',
      status: 'active',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Status / keep-alive endpoint
  if (method === 'GET' && query.action === 'status') {
    res.status(200).json({
      ok: true,
      action: 'status',
      connectionId,
      agentTag,
      connected: true,
      keepAlive: true,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Command relay endpoint (node -> portal)
  if (method === 'POST' && query.action === 'relay') {
    const payload = req.body || {};
    res.status(200).json({
      ok: true,
      action: 'relay',
      connectionId,
      agentTag,
      received: payload,
      relayedAt: new Date().toISOString(),
    });
    return;
  }

  // Keep-alive heartbeat (maintains active connection)
  if (method === 'GET' && query.action === 'heartbeat') {
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Connection-ID', connectionId);
    res.setHeader('X-Agent-Tag', agentTag);
    res.status(200).json({
      ok: true,
      action: 'heartbeat',
      connectionId,
      agentTag,
      alive: true,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Default: portal connection info
  res.status(200).json({
    ok: true,
    action: 'connect',
    agentTag,
    connectionId,
    nodeType,
    endpoint: '/api/node-connect',
    portal: process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'localhost',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
}
