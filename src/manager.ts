import type { WebSocket } from 'ws';
import type { WSConnection, WSMessage, WSManager } from './types.js';
import { randomUUID } from 'crypto';

/**
 * WebSocket Manager implementation
 */
export class WebSocketManager implements WSManager {
    private connections: Map<string, WSConnection> = new Map();

    /**
     * Add new connection
     */
    addConnection(ws: WebSocket, metadata?: Record<string, any>): WSConnection {
        const id = randomUUID();
        const connection: WSConnection = { ws, id, metadata };
        this.connections.set(id, connection);
        return connection;
    }

    /**
     * Get all active connections
     */
    getConnections(): Map<string, WSConnection> {
        return new Map(this.connections);
    }

    /**
     * Get connection by ID
     */
    getConnection(id: string): WSConnection | undefined {
        return this.connections.get(id);
    }

    /**
     * Send message to specific connection
     */
    send(id: string, message: WSMessage): boolean {
        const connection = this.connections.get(id);
        if (!connection || connection.ws.readyState !== 1) {
            return false;
        }

        try {
            const payload = JSON.stringify({
                ...message,
                timestamp: message.timestamp || Date.now()
            });
            connection.ws.send(payload);
            return true;
        } catch (error) {
            console.error(`Failed to send message to ${id}:`, error);
            return false;
        }
    }

    /**
     * Broadcast message to all connections
     */
    broadcast(message: WSMessage, exclude: string[] = []): void {
        const payload = JSON.stringify({
            ...message,
            timestamp: message.timestamp || Date.now()
        });

        this.connections.forEach((connection, id) => {
            if (exclude.includes(id)) return;
            if (connection.ws.readyState === 1) {
                try {
                    connection.ws.send(payload);
                } catch (error) {
                    console.error(`Failed to broadcast to ${id}:`, error);
                }
            }
        });
    }

    /**
     * Remove connection
     */
    removeConnection(id: string): boolean {
        return this.connections.delete(id);
    }

    /**
     * Disconnect a specific connection
     */
    disconnect(id: string): boolean {
        const connection = this.connections.get(id);
        if (!connection) return false;

        try {
            connection.ws.close();
            this.connections.delete(id);
            return true;
        } catch (error) {
            console.error(`Failed to disconnect ${id}:`, error);
            return false;
        }
    }

    /**
     * Get number of active connections
     */
    size(): number {
        return this.connections.size;
    }

    /**
     * Clear all connections
     */
    clear(): void {
        this.connections.forEach((connection) => {
            try {
                connection.ws.close();
            } catch (error) {
                // Ignore errors during cleanup
            }
        });
        this.connections.clear();
    }
}

// Global singleton instance
let globalManager: WebSocketManager | null = null;

/**
 * Get or create global WebSocket manager
 */
export function getWebSocketManager(): WebSocketManager {
    if (!globalManager) {
        globalManager = new WebSocketManager();
    }
    return globalManager;
}