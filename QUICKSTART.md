# Quick Start Guide

A quick guide to integrating WebSocket into your SvelteKit project.

## 1. Install

```bash
npm install sveltekit-ws ws
```

## 2. Setup Development (vite.config.ts)

```typescript
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { webSocketServer } from "sveltekit-ws/vite";

export default defineConfig({
  plugins: [
    webSocketServer({
      handlers: {
        onMessage: (connection, message) => {
          console.log("Got message:", message);
        },
      },
    }),
    sveltekit(),
  ],
});
```

## 3. Client Side (Svelte Component)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let ws: WebSocket;
  let messages = [];

  onMount(() => {
    if (!browser) return;

    ws = new WebSocket(`ws://${window.location.host}/ws`);

    ws.onmessage = (event) => {
      messages = [...messages, JSON.parse(event.data)];
    };
  });

  function send() {
    ws.send(JSON.stringify({
      type: 'chat',
      data: { text: 'Hello!' }
    }));
  }
</script>

<button on:click={send}>Send</button>

{#each messages as msg}
  <div>{JSON.stringify(msg)}</div>
{/each}
```

## 4. Broadcast ke Semua Client

```typescript
import { getWebSocketManager } from "sveltekit-ws";

// Handler onMessage
const manager = getWebSocketManager();
manager.broadcast({
  type: "notification",
  data: { message: "Hello everyone!" },
});
```

## 5. Send ke Client Specific

```typescript
manager.send("connection-id", {
  type: "private",
  data: { message: "Just for you" },
});
```

## Production Setup

For production with `@sveltejs/adapter-node`, create `server.js`:

```javascript
import { handler } from "./build/handler.js";
import express from "express";
import { createServer } from "http";
import { createWebSocketHandler } from "sveltekit-ws/server";

const app = express();
const server = createServer(app);

createWebSocketHandler(server, {
  handlers: {
    onMessage: (connection, message) => {
      // Handle message
    },
  },
});

app.use(handler);
server.listen(3000);
```

Update `package.json`:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

That's it! 🎉

For more examples, check the `/examples` folder.
