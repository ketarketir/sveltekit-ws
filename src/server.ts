import type { Server as HTTPServer } from 'http';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { WebSocketServer, WebSocket } from 'ws';
import type { WSServerOptions } from './types.js';
import { getWebSocketManager } from './manager.js';

/**
 * Create WebSocket handler for production server
 */
export function createWebSocketHandler(
    httpServer: HTTPServer,
    options: WSServerOptions = {}
) {
    const {
        path = '/ws',
        handlers = {},
        maxPayload = 1024 * 1024,
        heartbeat = true,
        heartbeatInterval = 30000,
        verifyClient
    } = options;

    const wss = new WebSocketServer({
        noServer: true,
        maxPayload,
        verifyClient: verifyClient
            ? (info, callback) => {
                Promise.resolve(verifyClient(info))
                    .then((result) => callback(result))
                    .catch(() => callback(false));
            }
            : undefined
    });

    const manager = getWebSocketManager();
    const heartbeatTimers = new Map<string, NodeJS.Timeout>();

    // Handle upgrade requests
    httpServer.on('upgrade', (
        request: IncomingMessage,
        socket: Duplex,
        head: Buffer
    ) => {
        const url = new URL(request.url || '', `http://${request.headers.host}`);

        if (url.pathname === path) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    // Handle connections
    wss.on('connection', async (ws: WebSocket, request: IncomingMessage) => {
        const connection = manager.addConnection(ws, {
            url: request.url,
            headers: request.headers,
            remoteAddress: request.socket.remoteAddress
        });

        console.log(`[WS] Client connected: ${connection.id}`);

        try {
            await handlers.onConnect?.(connection);
        } catch (error) {
            console.error('[WS] Error in onConnect handler:', error);
        }

        // Setup heartbeat
        if (heartbeat) {
            const timer = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.ping();
                }
            }, heartbeatInterval);
            heartbeatTimers.set(connection.id, timer);
        }

        // Handle messages
        ws.on('message', async (rawData) => {
            try {
                const message = JSON.parse(rawData.toString());
                await handlers.onMessage?.(connection, message);
            } catch (error) {
                console.error('[WS] Error handling message:', error);
                await handlers.onError?.(connection, error as Error);
            }
        });

        // Handle errors
        ws.on('error', async (error) => {
            console.error(`[WS] WebSocket error for ${connection.id}:`, error);
            await handlers.onError?.(connection, error);
        });

        // Handle disconnect
        ws.on('close', async () => {
            console.log(`[WS] Client disconnected: ${connection.id}`);

            const timer = heartbeatTimers.get(connection.id);
            if (timer) {
                clearInterval(timer);
                heartbeatTimers.delete(connection.id);
            }

            manager.removeConnection(connection.id);

            try {
                await handlers.onDisconnect?.(connection);
            } catch (error) {
                console.error('[WS] Error in onDisconnect handler:', error);
            }
        });
    });

    console.log(`[WS] WebSocket server initialized at ${path}`);

    // Return cleanup function
    return () => {
        heartbeatTimers.forEach((timer) => clearInterval(timer));
        heartbeatTimers.clear();
        manager.clear();
        wss.close();
    };
}