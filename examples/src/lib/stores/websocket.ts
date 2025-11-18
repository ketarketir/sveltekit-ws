import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export function createWebSocketStore(config: WSStoreConfig = {}) {
  const {
    url = browser ? `ws://${window.location.host}/ws` : '',
    userId,
    username,
    avatar_url,
    reconnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 3000,
    onMessage
  } = config;

  const { subscribe, set, update } = writable<WSStoreState>({
    connected: false,
    identified: false,
    messages: [],
    error: null,
    reconnecting: false
  });

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectCount = 0;

  function connect() {
    if (!browser) return;

    try {
      ws = new WebSocket(url);

      ws.onopen = (event) => {
        console.log('[WS Client] Connected');
        reconnectCount = 0;
        update((state) => ({
          ...state,
          connected: true,
          error: null,
          reconnecting: false
        }));

        // Auto-identify if userId provided
        if (userId) {
          identify(userId, username, avatar_url);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle identified confirmation
          if (message.type === 'identified') {
            console.log('[WS Client] Identified:', message.data);
            update((state) => ({ ...state, identified: true }));
          }

          update((state) => ({
            ...state,
            messages: [...state.messages, message]
          }));

          onMessage?.(message);
        } catch (err) {
          console.error('[WS Client] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[WS Client] Error');
        update((state) => ({
          ...state,
          error: 'WebSocket connection error',
          reconnecting: false
        }));
      };

      ws.onclose = (event) => {
        console.log('[WS Client] Disconnected');
        update((state) => ({
          ...state,
          connected: false,
          identified: false
        }));

        if (reconnect && reconnectCount < reconnectAttempts) {
          update((state) => ({ ...state, reconnecting: true }));
          reconnectTimer = setTimeout(() => {
            reconnectCount++;
            console.log(`[WS Client] Reconnecting... Attempt ${reconnectCount}`);
            connect();
          }, reconnectDelay);
        } else if (reconnectCount >= reconnectAttempts) {
          update((state) => ({
            ...state,
            error: 'Failed to reconnect',
            reconnecting: false
          }));
        }
      };
    } catch (err) {
      console.error('[WS Client] Failed to create WebSocket:', err);
      update((state) => ({
        ...state,
        error: 'Failed to create WebSocket connection'
      }));
    }
  }

  function identify(userId: string, username?: string, avatar?: string) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'identify',
        data: { userId, username, avatar }
      }));
    }
  }

  function send(type: string, data: any) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('[WS Client] Not connected');
    }
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
    reconnectCount = 0;
    set({
      connected: false,
      identified: false,
      messages: [],
      error: null,
      reconnecting: false
    });
  }

  return {
    subscribe,
    connect,
    disconnect,
    send,
    identify
  };
}
