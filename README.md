# SvelteKit WebSocket

WebSocket integration for SvelteKit without external server - seamlessly works in both development and production.

## Features

- 🚀 **Zero Configuration** - Works out of the box with SvelteKit
- 🔄 **Auto Reconnection** - Built-in reconnection logic with configurable attempts
- 💪 **Type Safe** - Full TypeScript support with proper types
- 🔌 **No External Server** - Integrated directly into Vite dev server and production
- 🎯 **Connection Management** - Easy broadcast, send to specific clients
- 💗 **Heartbeat Support** - Automatic ping/pong to keep connections alive
- 🛡️ **Client Verification** - Custom authentication/authorization hooks
- 📦 **Small Bundle** - Minimal dependencies

## Installation

```bash
npm install sveltekit-ws ws
# or
pnpm add sveltekit-ws ws
# or
yarn add sveltekit-ws ws
```

## Usage

### 1. Development Setup (vite.config.ts)

```typescript
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { webSocketServer } from "sveltekit-ws/vite";
import { getWebSocketManager } from "sveltekit-ws";

export default defineConfig({
  plugins: [
    // ⚠️ WebSocket plugin MUST be before sveltekit()
    webSocketServer({
      path: "/ws", // WebSocket endpoint
      handlers: {
        onConnect: (connection) => {
          console.log("Client connected:", connection.id);

          const manager = getWebSocketManager();
          manager.send(connection.id, {
            type: "welcome",
            data: { message: "Hello!" },
          });
        },

        onMessage: (connection, message) => {
          console.log("Message:", message);

          const manager = getWebSocketManager();

          // Echo back
          manager.send(connection.id, {
            type: "echo",
            data: message.data,
          });

          // Broadcast to all except sender
          manager.broadcast({ type: "broadcast", data: message.data }, [
            connection.id,
          ]);
        },

        onDisconnect: (connection) => {
          console.log("Client left:", connection.id);
        },
      },
    }),

    sveltekit(),
  ],
});
```

### 2. Production Setup (server.js)

For production with `@sveltejs/adapter-node`:

```javascript
import { handler } from "./build/handler.js";
import express from "express";
import { createServer } from "http";
import { createWebSocketHandler } from "sveltekit-ws/server";
import { getWebSocketManager } from "sveltekit-ws";

const app = express();
const server = createServer(app);

// Setup WebSocket
createWebSocketHandler(server, {
  path: "/ws",
  handlers: {
    onConnect: (connection) => {
      const manager = getWebSocketManager();
      manager.send(connection.id, {
        type: "welcome",
        data: { message: "Connected!" },
      });
    },
    onMessage: (connection, message) => {
      const manager = getWebSocketManager();
      manager.broadcast({ type: "chat", data: message.data });
    },
  },
});

// SvelteKit handler
app.use(handler);

const PORT = process.env.PORT || 3000;
server.listen(PORT);
```

### 3. Client Side (Svelte Component)

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  let ws: WebSocket | null = null;
  let messages: any[] = [];
  let connected = false;

  onMount(() => {
    if (!browser) return;

    ws = new WebSocket(`ws://${window.location.host}/ws`);

    ws.onopen = () => {
      connected = true;
      console.log('Connected!');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      messages = [...messages, message];
    };

    ws.onclose = () => {
      connected = false;
      console.log('Disconnected');
    };
  });

  onDestroy(() => {
    ws?.close();
  });

  function sendMessage(text: string) {
    if (ws && connected) {
      ws.send(JSON.stringify({
        type: 'chat',
        data: { text }
      }));
    }
  }
</script>

<div>
  <p>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>

  {#each messages as msg}
    <div>{msg.type}: {JSON.stringify(msg.data)}</div>
  {/each}

  <button on:click={() => sendMessage('Hello!')}>
    Send
  </button>
</div>
```

## Advanced Usage

### Using the WebSocket Store

```typescript
import { createWebSocketStore } from "./websocket-store";

// Create store with auto-reconnection
const ws = createWebSocketStore({
  url: "ws://localhost:3000/ws",
  reconnect: true,
  reconnectAttempts: 5,
  reconnectDelay: 3000,
  onMessage: (message) => {
    console.log("Received:", message);
  },
});

// Connect
ws.connect();

// Send message
ws.send({ type: "chat", data: { text: "Hello!" } });

// Type-safe send
ws.sendTyped("chat", { text: "Hello!" });

// Disconnect
ws.disconnect();
```

### Connection Management

```typescript
import { getWebSocketManager } from "sveltekit-ws";

const manager = getWebSocketManager();

// Get all connections
const connections = manager.getConnections();

// Get specific connection
const conn = manager.getConnection("connection-id");

// Send to specific client
manager.send("connection-id", {
  type: "private",
  data: { message: "Only for you" },
});

// Broadcast to all
manager.broadcast({
  type: "announcement",
  data: { message: "Hello everyone!" },
});

// Broadcast to all except some
manager.broadcast(
  { type: "message", data: "Hello!" },
  ["id-1", "id-2"] // exclude these
);

// Disconnect client
manager.disconnect("connection-id");

// Get connection count
const count = manager.size();
```

### Custom Client Verification

```typescript
webSocketServer({
  verifyClient: async ({ origin, secure, req }) => {
    // Check authentication
    const token = req.headers["authorization"];
    if (!token) return false;

    try {
      const user = await verifyToken(token);
      return !!user;
    } catch {
      return false;
    }
  },
});
```

### Message Types

```typescript
interface WSMessage<T = any> {
  type: string;
  data: T;
  timestamp?: number;
}

interface WSConnection {
  ws: WebSocket;
  id: string;
  metadata?: Record<string, any>;
}
```

## Configuration Options

```typescript
interface WSServerOptions {
  path?: string; // Default: '/ws'
  handlers?: WSHandlers; // Event handlers
  maxPayload?: number; // Default: 1MB
  heartbeat?: boolean; // Default: true
  heartbeatInterval?: number; // Default: 30000ms
  verifyClient?: (info) => boolean; // Custom verification
}
```

## Examples

Check the `/examples` directory for:

- Basic chat application
- Real-time notifications
- Multiplayer game state sync
- Collaborative editing

## Deployment

### Vercel / Cloudflare / Netlify

WebSocket is not supported in serverless platforms. Use adapter-node with VPS/dedicated server.

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "server.js"]
```

### PM2

```json
{
  "apps": [
    {
      "name": "sveltekit-app",
      "script": "server.js",
      "instances": 1,
      "exec_mode": "cluster"
    }
  ]
}
```

## Troubleshooting

### WebSocket not connecting in production

Make sure:

1. Custom server is setup correctly
2. Port has been exposed (3000 or sesuai config)
3. Firewall allow WebSocket connections
4. Reverse proxy (nginx) support WebSocket upgrade

### Nginx Configuration

```nginx
location /ws {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

## Migration from Old Library

Dari `ubermanu/sveltekit-websocket`:

1. Update dependencies
2. Change plugin import dari `vite-plugin-websocket` ke `sveltekit-ws/vite`
3. Update handler structure (lihat docs)
4. Update client code untuk use new message format

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © 2024

## Credits

Inspired by [ubermanu/sveltekit-websocket](https://github.com/ubermanu/sveltekit-websocket)
