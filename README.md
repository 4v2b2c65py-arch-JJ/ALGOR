# ALGOR — Omnitrix Portal

Omnidirectional node connection portal for the Machine Driver Stack.

## Portal

Frontend portal hosted on Vercel: `https://omnitrix-portal.vercel.app`

Backend connection endpoint (for omnidirectional node):
`https://omnitrix-portal.vercel.app/api/node-connect`

## Node Connection

The omnidirectional node connects to:

```
GET  /api/node-connect?action=handshake    — establish connection
GET  /api/node-connect?action=status       — check connection status
GET  /api/node-connect?action=heartbeat    — keep-alive heartbeat
POST /api/node-connect?action=relay        — relay commands to portal
```

Headers:
- `X-Agent-Tag`: agent identifier (default: `omnitrix-node`)
- `X-Connection-ID`: unique connection id
- `X-Node-Type`: node type (default: `omnidirectional`)

## Files

- `index.html` — frontend portal (served by Vercel)
- `api/node-connect.js` — backend connection endpoint (served by Vercel)
- `src/machinedrivers.js` — Machine Driver Stack modules
- `src/hiliosphereumanite.ts` — TypeScript source (Hiliosphereumanite mechanism)

## Security

Secret files (`.env`, `*.key`, `*.secret`, etc.) are excluded via `.gitignore` and never committed.

## Deploy

```bash
vercel --prod
```
