import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { webSocketServer } from 'sveltekit-ws/vite';
import { getWebSocketManager } from 'sveltekit-ws';


const rooms = new Map<string, Set<string>>();
const userToConnection = new Map<string, string>();

function joinRoom(userId: string, roomId: string) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }
    rooms.get(roomId)!.add(userId);
}

function leaveRoom(userId: string, roomId: string) {
    const room = rooms.get(roomId);
    if (room) {
        room.delete(userId);
        if (room.size === 0) {
            rooms.delete(roomId);
        }
    }
}

function broadcastToRoom(roomId: string, message: any, exclude?: string[]) {
    const room = rooms.get(roomId);
    if (!room) return;

    const manager = getWebSocketManager();
    room.forEach((userId) => {
        if (!exclude?.includes(userId)) {
            manager.send(userId, message);
        }
    });
}

export default defineConfig({
    plugins: [
        webSocketServer({
            path: '/ws',
            handlers: {
                onConnect: (connection) => {
                    console.log(`[WS] Connection ${connection.id} established`);

                    // Initialize empty metadata
                    connection.metadata = {
                        userId: null,
                        rooms: [],
                        connectedAt: Date.now()
                    };
                },

                onMessage: (connection, message) => {
                    const manager = getWebSocketManager();

                    switch (message.type) {
                        case 'identify':
                            // User identifies themselves with userId
                            const userId = message.data.userId;

                            if (userId) {
                                // Update connection metadata
                                connection.metadata = {
                                    ...connection.metadata,
                                    userId: userId,
                                    username: message.data.username,
                                    avatar: message.data.avatar
                                };

                                // Update mapping
                                userToConnection.set(userId, connection.id);

                                console.log(`[WS] User ${userId} identified on connection ${connection.id}`);

                                // Send confirmation
                                manager.send(connection.id, {
                                    type: 'identified',
                                    data: {
                                        connectionId: connection.id,
                                        userId: userId
                                    }
                                });
                            }
                            break;

                        case 'join-room':
                            const userIdForRoom = connection.metadata?.userId;
                            if (userIdForRoom) {
                                joinRoom(userIdForRoom, message.data.roomId);

                                // Update connection metadata
                                const currentRooms = connection.metadata?.rooms || [];
                                connection.metadata = {
                                    ...connection.metadata,
                                    rooms: [...currentRooms, message.data.roomId]
                                };

                                // Notify room members
                                broadcastToRoom(
                                    message.data.roomId,
                                    {
                                        type: 'user-joined',
                                        data: {
                                            userId: userIdForRoom,
                                            username: connection.metadata?.username,
                                            roomId: message.data.roomId
                                        }
                                    },
                                    [connection.id]
                                );

                                // Send room info
                                const room = rooms.get(message.data.roomId);
                                manager.send(connection.id, {
                                    type: 'room-info',
                                    data: {
                                        roomId: message.data.roomId,
                                        members: Array.from(room || [])
                                    }
                                });
                            }
                            break;

                        case 'leave-room':
                            const userLeavingRoom = connection.metadata?.userId;
                            if (userLeavingRoom) {
                                leaveRoom(userLeavingRoom, message.data.roomId);

                                // Update connection metadata
                                const updatedRooms = (connection.metadata?.rooms || []).filter(
                                    (r: string) => r !== message.data.roomId
                                );
                                connection.metadata = {
                                    ...connection.metadata,
                                    rooms: updatedRooms
                                };

                                broadcastToRoom(message.data.roomId, {
                                    type: 'user-left',
                                    data: {
                                        userId: userLeavingRoom,
                                        roomId: message.data.roomId
                                    }
                                });
                            }
                            break;

                        case 'room-message':
                            broadcastToRoom(message.data.roomId, {
                                type: 'room-message',
                                data: {
                                    userId: connection.metadata?.userId,
                                    username: connection.metadata?.username,
                                    roomId: message.data.roomId,
                                    text: message.data.text,
                                    timestamp: Date.now()
                                }
                            });
                            break;

                        case 'typing':
                            broadcastToRoom(
                                message.data.roomId,
                                {
                                    type: 'typing',
                                    data: {
                                        userId: connection.metadata?.userId,
                                        roomId: message.data.roomId,
                                        isTyping: message.data.isTyping
                                    }
                                },
                                [connection.id]
                            );
                            break;

                        default:
                            console.log('[WS] Unknown message type:', message.type);
                    }
                },

                onDisconnect: (connection) => {
                    const userId = connection.metadata?.userId;

                    if (userId) {
                        // Remove from all rooms
                        const userRooms = connection.metadata?.rooms || [];
                        userRooms.forEach((roomId: string) => {
                            leaveRoom(userId, roomId);
                            broadcastToRoom(roomId, {
                                type: 'user-left',
                                data: { userId, roomId }
                            });
                        });

                        // Remove from mapping
                        userToConnection.delete(userId);
                    }

                    console.log(`[WS] Connection ${connection.id} disconnected`);
                },

                onError: (connection, error) => {
                    console.error(`[WS] Error for ${connection.id}:`, error);
                }
            },

            maxPayload: 1024 * 1024,
            heartbeat: true,
            heartbeatInterval: 30000
        }),
        sveltekit(),
    ],
    ssr: {
        noExternal: ['svelte-motion']
    }
});
