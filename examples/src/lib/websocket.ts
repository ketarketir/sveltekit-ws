import { type RequestEvent } from '@sveltejs/kit';
import { getWebSocketManager, createWebSocketHandler, type WebSocketManager } from "sveltekit-ws";

export class WebSocketHelper {
  private event: RequestEvent;
  private wsManager: WebSocketManager;
  constructor(event: RequestEvent) {
    this.event = event;
    this.wsManager = getWebSocketManager();
  }
  /**
    * Send message to specific user by connection ID
    */
  async sendToConnection<T>(connectionId: string, type: string, data: T): Promise<boolean> {
    return this.wsManager.send(connectionId, {
      type,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Send message to specific user by user ID (requires metadata mapping)
   */
  async sendToUser<T>(userId: string, type: string, data: T): Promise<boolean> {
    const connections = this.wsManager.getConnections();

    // Find connection by user ID from metadata
    for (const [connId, conn] of connections) {
      if (conn.metadata?.userId === userId) {
        return this.wsManager.send(connId, {
          type,
          data,
          timestamp: Date.now()
        });
      }
    }

    console.warn(`[WS Helper] User ${userId} not found or not connected`);
    return false;
  }

  /**
   * Broadcast to all connected clients
   */
  async broadcast<T>(type: string, data: T, excludeUserIds: string[] = []): Promise<void> {
    const connections = this.wsManager.getConnections();
    const excludeConnIds: string[] = [];

    // Convert user IDs to connection IDs
    if (excludeUserIds.length > 0) {
      for (const [connId, conn] of connections) {
        if (conn.metadata?.userId && excludeUserIds.includes(conn.metadata.userId)) {
          excludeConnIds.push(connId);
        }
      }
    }

    this.wsManager.broadcast(
      {
        type,
        data,
        timestamp: Date.now()
      },
      excludeConnIds
    );
  }

  /**
   * Broadcast to users in a specific room
   */
  async broadcastToRoom<T>(roomId: string, type: string, data: T, excludeUserIds: string[] = []): Promise<void> {
    const connections = this.wsManager.getConnections();

    for (const [connId, conn] of connections) {
      // Check if user is in room
      const userRooms = conn.metadata?.rooms as string[] | undefined;
      if (userRooms?.includes(roomId)) {
        // Check if user should be excluded
        const shouldExclude = excludeUserIds.includes(conn.metadata?.userId);
        if (!shouldExclude) {
          this.wsManager.send(connId, {
            type,
            data,
            timestamp: Date.now()
          });
        }
      }
    }
  }

  /**
   * Get all connected users
   */
  getConnectedUsers(): Array<{ connectionId: string; userId?: string; metadata?: any }> {
    const connections = this.wsManager.getConnections();
    const users: Array<{ connectionId: string; userId?: string; metadata?: any }> = [];

    for (const [connId, conn] of connections) {
      users.push({
        connectionId: connId,
        userId: conn.metadata?.userId,
        metadata: conn.metadata
      });
    }

    return users;
  }

  /**
   * Get number of connected clients
   */
  getConnectionCount(): number {
    return this.wsManager.size();
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    const connections = this.wsManager.getConnections();

    for (const [_, conn] of connections) {
      if (conn.metadata?.userId === userId) {
        return true;
      }
    }

    return false;
  }

  /**
   * Disconnect specific user
   */
  async disconnectUser(userId: string): Promise<boolean> {
    const connections = this.wsManager.getConnections();

    for (const [connId, conn] of connections) {
      if (conn.metadata?.userId === userId) {
        return this.wsManager.disconnect(connId);
      }
    }

    return false;
  }
}
