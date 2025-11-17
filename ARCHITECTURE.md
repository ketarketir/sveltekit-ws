# Architecture Documentation

## Overview

SvelteKit-WS is a library that provides WebSocket integration directly into SvelteKit without requiring an external server. This library works differently in development and production environments.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SvelteKit App                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐         ┌────────────────────┐     │
│  │  Svelte Components │         │   Server Routes    │     │
│  │                    │         │                    │     │
│  │  - Chat UI         │         │  - API Handlers    │     │
│  │  - WebSocket Store │         │  - Server Logic    │     │
│  └────────┬───────────┘         └──────────┬─────────┘     │
│           │                                 │                │
│           │ WebSocket                       │ HTTP           │
│           ├─────────────────────────────────┤                │
└───────────┼─────────────────────────────────┼────────────────┘
            │                                 │
            │                                 │
┌───────────▼─────────────────────────────────▼────────────────┐
│                  WebSocket Layer                              │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Development                      Production                  │
│  ┌────────────────────┐          ┌────────────────────┐      │
│  │  Vite Dev Server   │          │  Custom Server     │      │
│  │  + WS Plugin       │          │  (Express + HTTP)  │      │
│  │                    │          │                    │      │
│  │  - Vite Plugin     │          │  - Node HTTP       │      │
│  │  - Hot Reload      │          │  - WebSocket       │      │
│  │  - Dev Tools       │          │  - Production      │      │
│  └────────────────────┘          └────────────────────┘      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              │
                              │
                    ┌─────────▼──────────┐
                    │  WebSocket Manager │
                    │                    │
                    │  - Connections Map │
                    │  - Broadcast       │
                    │  - Send            │
                    │  - Heartbeat       │
                    └────────────────────┘
```

## Component Architecture

### 1. Core Components

```
src/
├── types.ts          → TypeScript definitions
├── manager.ts        → Connection management
├── vite.ts           → Development plugin
└── server.ts         → Production handler
```

#### types.ts

- Defines all TypeScript interfaces
- WSConnection, WSMessage, WSHandlers, etc.
- Type safety across the library

#### manager.ts

- Singleton WebSocket connection manager
- Maintains Map<id, WSConnection>
- Handles broadcast, send, disconnect
- Thread-safe operations

#### vite.ts

- Vite plugin for development
- Intercepts HTTP upgrade requests
- Integrates with Vite dev server
- Hot reload compatible

#### server.ts

- Production server handler
- Works with Node HTTP server
- Handles upgrade requests
- Graceful shutdown support

### 2. Connection Flow

#### Development Mode

```
Client                Vite Plugin           Manager
  │                        │                   │
  │───WebSocket Connect───>│                   │
  │                        │──Add Connection──>│
  │<────── OnOpen ─────────│                   │
  │                        │                   │
  │────Send Message───────>│                   │
  │                        │──Handle Message──>│
  │                        │<──Get Connections─│
  │<───Broadcast Message───│                   │
  │                        │                   │
  │────Close Connection───>│                   │
  │                        │──Remove Conn─────>│
  │                        │                   │
```

#### Production Mode

```
Client              Express Server        Manager
  │                        │                   │
  │───WebSocket Connect───>│                   │
  │                        │──Add Connection──>│
  │<────── OnOpen ─────────│                   │
  │                        │                   │
  │────Send Message───────>│                   │
  │                        │──Handle Message──>│
  │                        │<──Broadcast───────│
  │<───Broadcast Message───│                   │
  │                        │                   │
```

### 3. Message Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Message Lifecycle                         │
└──────────────────────────────────────────────────────────────┘

Client sends:                Server receives:
{ type: 'chat',             { type: 'chat',
  data: { text: 'Hi' } }      data: { text: 'Hi' } }
                                        │
                                        ▼
                              ┌─────────────────┐
                              │ Message Handler │
                              │  (onMessage)    │
                              └────────┬────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────┐
        │                              │                       │
        ▼                              ▼                       ▼
┌──────────────┐            ┌──────────────┐         ┌─────────────┐
│ Send to One  │            │  Broadcast   │         │   Custom    │
│              │            │              │         │   Logic     │
│ manager.send │            │manager.broad │         │             │
│   (conn.id)  │            │   cast()     │         │  Any code   │
└──────┬───────┘            └──────┬───────┘         └──────┬──────┘
       │                           │                        │
       └───────────────────────────┴────────────────────────┘
                                   │
                                   ▼
                          All connected clients
                          receive the message
```

## Data Structures

### WSConnection

```typescript
{
  ws: WebSocket,           // Raw WebSocket instance
  id: string,              // UUID v4
  metadata?: {             // Optional custom data
    userId?: string,
    username?: string,
    role?: string,
    // ... any custom fields
  }
}
```

### WSMessage

```typescript
{
  type: string,            // Message type identifier
  data: any,               // Message payload (any shape)
  timestamp?: number       // Auto-added if not present
}
```

### Internal State (Manager)

```typescript
Map<string, WSConnection> {
  "uuid-1234": {
    ws: WebSocket { ... },
    id: "uuid-1234",
    metadata: { ... }
  },
  "uuid-5678": {
    ws: WebSocket { ... },
    id: "uuid-5678",
    metadata: { ... }
  },
  ...
}
```

## Request Flow Diagrams

### HTTP Upgrade Request

```
┌────────┐                                        ┌────────┐
│ Client │                                        │ Server │
└───┬────┘                                        └───┬────┘
    │                                                 │
    │  GET /ws HTTP/1.1                               │
    │  Upgrade: websocket                             │
    │  Connection: Upgrade                            │
    │  Sec-WebSocket-Key: xxx                         │
    ├────────────────────────────────────────────────>│
    │                                                 │
    │                              ┌──────────────────┤
    │                              │ Verify Request   │
    │                              │ (verifyClient)   │
    │                              └──────────────────┤
    │                                                 │
    │  HTTP/1.1 101 Switching Protocols               │
    │  Upgrade: websocket                             │
    │  Connection: Upgrade                            │
    │<────────────────────────────────────────────────┤
    │                                                 │
    │           WebSocket Connection Established      │
    │<═══════════════════════════════════════════════>│
    │                                                 │
```

### Heartbeat Flow

```
Server                                    Client
  │                                         │
  │────────── Ping (every 30s) ───────────>│
  │                                         │
  │<────────── Pong ───────────────────────│
  │                                         │
  │  (Connection alive)                     │
  │                                         │
  │────────── Ping ───────────────────────>│
  │                                         │
  │  (No response after timeout)            │
  │                                         │
  │  Close connection                       │
  │────────── Close Frame ────────────────>│
  │                                         │
```

## Scalability Considerations

### Current Implementation (Single Server)

```
┌───────────┐        ┌───────────┐        ┌───────────┐
│ Client A  │        │ Client B  │        │ Client C  │
└─────┬─────┘        └─────┬─────┘        └─────┬─────┘
      │                    │                    │
      └────────────────────┼────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Server    │
                    │             │
                    │  Manager    │
                    │  - 3 conns  │
                    └─────────────┘
```

### Future: Multi-Server with Redis

```
┌───────┐  ┌───────┐     ┌───────┐  ┌───────┐
│Client1│  │Client2│     │Client3│  │Client4│
└───┬───┘  └───┬───┘     └───┬───┘  └───┬───┘
    │          │              │          │
    ▼          ▼              ▼          ▼
┌─────────────────┐      ┌─────────────────┐
│   Server A      │      │   Server B      │
│                 │      │                 │
│  Manager (2)    │      │  Manager (2)    │
└────────┬────────┘      └────────┬────────┘
         │                        │
         └────────────┬───────────┘
                      │
                  ┌───▼────┐
                  │ Redis  │
                  │ Pub/Sub│
                  └────────┘
```

## Security Model

### Connection Verification

```
Client Request
      │
      ▼
┌─────────────────┐
│ verifyClient()  │
│                 │
│ - Check origin  │
│ - Verify token  │
│ - Check IP      │
│ - Rate limit    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
Accept    Reject
    │         │
    ▼         ▼
  Open      Close
```

### Message Validation

```
Incoming Message
      │
      ▼
┌─────────────────┐
│ Parse JSON      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
Valid     Invalid
    │         │
    ▼         ▼
Process   Ignore/Error
```

## Performance Characteristics

### Memory Usage

- Per connection: ~1-2 KB
- 1000 connections: ~1-2 MB
- Scales linearly with connections

### CPU Usage

- Idle: Minimal (heartbeat only)
- Active: O(n) for broadcasts
- Can handle 10k+ connections per core

### Network

- Heartbeat: ~100 bytes per 30s per connection
- Message overhead: ~20 bytes (JSON structure)
- Binary support: TODO

## Error Handling

```
Error Occurs
      │
      ▼
┌─────────────────┐
│ Error Type?     │
└────────┬────────┘
         │
    ┌────┴────┬────────┬─────────┐
    │         │        │         │
    ▼         ▼        ▼         ▼
Network   Parse    Handler   System
  Error    Error    Error    Error
    │         │        │         │
    ▼         ▼        ▼         ▼
 Retry    Ignore   onError   Crash
 Connect  Message  Callback  + Log
```

## Deployment Architecture

### Development

```
localhost:5173
      │
      ▼
┌─────────────┐
│ Vite Server │
├─────────────┤
│ SvelteKit   │
│ WebSocket   │
│ Hot Reload  │
└─────────────┘
```

### Production

```
┌──────────────┐
│   Internet   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Nginx     │  (Reverse Proxy)
├──────────────┤
│  Port 80/443 │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Node.js    │  (Express + WS)
├──────────────┤
│  Port 3000   │
│              │
│ SvelteKit    │
│ WebSocket    │
└──────────────┘
```

## Summary

SvelteKit-WS provides a clean abstraction over WebSocket connections in SvelteKit by:

1. Using Vite plugins for development
2. Custom server wrapper for production
3. Centralized connection management
4. Type-safe message handling
5. Built-in health monitoring
6. Graceful error handling

The architecture is designed to be:

- **Simple**: Easy to understand and use
- **Flexible**: Adaptable to various use cases
- **Scalable**: Can handle thousands of connections
- **Maintainable**: Clean separation of concerns
- **Production-ready**: Proper error handling and monitoring
