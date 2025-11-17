import type { WebSocket } from 'ws';

/**
 * WebSocket connection with metadata
 */
export interface WSConnection {
    ws: WebSocket;
    id: string;
    metadata?: Record<string, any>;
}

/**
 * WebSocket message structure
 */
export interface WSMessage<T = any> {
    type: string;
    data: T;
    timestamp?: number;
}

/**
 * WebSocket event handlers
 */
export interface WSHandlers {
    onConnect?: (connection: WSConnection) => void | Promise<void>;
    onDisconnect?: (connection: WSConnection) => void | Promise<void>;
    onMessage?: (connection: WSConnection, message: WSMessage) => void | Promise<void>;
    onError?: (connection: WSConnection, error: Error) => void | Promise<void>;
}

/**
 * WebSocket server options
 */
export interface WSServerOptions {
    /**
     * Path to handle WebSocket connections
     * @default '/ws'
     */
    path?: string;

    /**
     * Event handlers
     */
    handlers?: WSHandlers;

    /**
     * Maximum message size in bytes
     * @default 1048576 (1MB)
     */
    maxPayload?: number;

    /**
     * Enable ping/pong heartbeat
     * @default true
     */
    heartbeat?: boolean;

    /**
     * Heartbeat interval in milliseconds
     * @default 30000
     */
    heartbeatInterval?: number;

    /**
     * Custom connection validator
     */
    verifyClient?: (info: {
        origin: string;
        secure: boolean;
        req: any;
    }) => boolean | Promise<boolean>;
}

/**
 * WebSocket manager for handling connections
 */
export interface WSManager {
    /**
     * Get all active connections
     */
    getConnections(): Map<string, WSConnection>;

    /**
     * Get connection by ID
     */
    getConnection(id: string): WSConnection | undefined;

    /**
     * Send message to specific connection
     */
    send(id: string, message: WSMessage): boolean;

    /**
     * Broadcast message to all connections
     */
    broadcast(message: WSMessage, exclude?: string[]): void;

    /**
     * Disconnect a specific connection
     */
    disconnect(id: string): boolean;

    /**
     * Get number of active connections
     */
    size(): number;
}