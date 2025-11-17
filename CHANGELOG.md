# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-18

### Added

- Initial release of sveltekit-ws
- Vite plugin for development WebSocket integration
- Custom server handler for production with adapter-node
- Connection manager with broadcast and targeted send capabilities
- Heartbeat/ping-pong support for connection health monitoring
- Auto-reconnection logic with configurable retry attempts
- TypeScript support with full type definitions
- Client verification/authentication hooks
- Metadata support for connections
- Graceful shutdown handling
- Comprehensive examples:
  - Basic WebSocket demo
  - Advanced chat room with rooms
  - Reusable Svelte store
  - Production server setup
  - Authentication example
  - Typing indicators
- Full documentation:
  - README with detailed API reference
  - Quick Start guide
  - Step-by-step tutorial
  - Example implementations

### Features

- ✅ Zero external server required
- ✅ Works seamlessly in development and production
- ✅ Full TypeScript support
- ✅ Room-based messaging support
- ✅ Connection pooling and management
- ✅ Broadcast to all or specific clients
- ✅ Automatic heartbeat with configurable intervals
- ✅ Custom client verification
- ✅ Message type safety
- ✅ Production-ready with graceful shutdown

### Documentation

- Complete API reference
- Multiple working examples
- Production deployment guide
- Nginx configuration examples
- Troubleshooting guide

## [Unreleased]

### Planned Features

- [ ] Built-in room management system
- [ ] Message persistence option
- [ ] Rate limiting per connection
- [ ] Binary message support
- [ ] Compression support
- [ ] Redis adapter for horizontal scaling
- [ ] Built-in authentication middleware
- [ ] Metrics and monitoring
- [ ] Admin dashboard
- [ ] Message encryption
- [ ] File transfer support

### Known Issues

- WebSocket not supported on serverless platforms (Vercel, Netlify, etc.)
- Requires adapter-node for production
- Single server limitation (no built-in clustering yet)

## Migration Guides

### From ubermanu/sveltekit-websocket

If you're migrating from the older `ubermanu/sveltekit-websocket`:

1. **Update dependencies:**

   ```bash
   npm uninstall vite-plugin-websocket
   npm install sveltekit-ws ws
   ```

2. **Update vite.config.ts:**

   ```typescript
   // Old
   import websocket from "vite-plugin-websocket";

   // New
   import { webSocketServer } from "sveltekit-ws/vite";
   ```

3. **Update handler structure:**

   ```typescript
   // Old
   websocket({
     "/ws": {
       handler: (data) => {
         /* ... */
       },
     },
   });

   // New
   webSocketServer({
     path: "/ws",
     handlers: {
       onMessage: (connection, message) => {
         /* ... */
       },
     },
   });
   ```

4. **Update message format:**

   - Old: Custom format
   - New: `{ type: string, data: any, timestamp?: number }`

5. **Update broadcast logic:**

   ```typescript
   // Old
   import { broadcast } from "vite-plugin-websocket";
   broadcast("/ws", data);

   // New
   import { getWebSocketManager } from "sveltekit-ws";
   const manager = getWebSocketManager();
   manager.broadcast({ type: "message", data });
   ```

## Support

- GitHub Issues: [Report bugs or request features]
- Documentation: See README.md and TUTORIAL.md
- Examples: Check /examples directory

## License

MIT License - See LICENSE file for details
