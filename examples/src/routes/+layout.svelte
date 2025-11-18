<script lang="ts">
  import { setContext } from "svelte";
  import { page } from "$app/state";
  import { createWebSocketStore } from "../lib/stores/websocket";

  const ws = createWebSocketStore({
    url: `ws://${page.url.host}/ws`,
    userId: page.data.user?.id,
    username: page.data.user?.username,
    avatar_url: page.data.user?.avatar_url || "/images/avatar.png",
    onMessage: (msg) => {
      // console.log('[App] WebSocket message:', msg);
      // Handle global notifications
      if (msg.type === "notification") {
        // Show toast notification
        // console.log('Notification:', msg.data);
      }
    },
  });
  setContext("ws", ws);
</script>

<div>
  <!-- Your HTML content here -->
</div>

<style scoped>
  /* Your styles here */
</style>
