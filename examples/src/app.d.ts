import { WebSocketHelper } from './lib/websocket';

declare global {
  namespace App {
    interface Locals {
      ws: WebSocketHelper;
    }
  }
  interface MessageData {
    content: string;
    timestamp: Date;
    type: 'text' | 'system' | 'notification';
    message_type?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'link' | 'code' | 'quote' | 'mention';
    status: 'success' | 'error' | 'info' | 'warning';
  }
  interface WSMessage<T = MessageData> {
    userId: string;
    roomId: string;
    type: string;
    data: T;
    timestamp?: Date;
  }
  interface WSStoreState {
    connected: boolean;
    messages: WSMessage[];
    identified: boolean;
    error: string | null;
    reconnecting: boolean;
  }

  interface WSStoreConfig {
    url?: string;
    userId?: string;
    username?: string;
    avatar_url?: string;
    reconnect?: boolean;
    reconnectAttempts?: number;
    reconnectDelay?: number;
    onMessage?: (message: WSMessage) => void;
  }
}

export { }
