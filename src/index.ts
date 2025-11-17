export { getWebSocketManager, WebSocketManager } from './manager.js';
export type {
    WSConnection,
    WSMessage,
    WSHandlers,
    WSServerOptions,
    WSManager
} from './types.js';

// Re-export for convenience
export { webSocketServer } from './vite.js';
export { createWebSocketHandler } from './server.js';