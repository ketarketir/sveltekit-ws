<script lang="ts">
  import { getContext } from "svelte";
  import { createWebSocketStore } from "../lib/stores/websocket";

  const ws = getContext("ws");

  let messages = $derived<ReturnType<typeof createWebSocketStore>>(ws.messages);
</script>

<div>
  <!-- Your HTML content here -->
  {#each messages as msg}
    <div>
      <img src={msg.avatar_url} alt={msg.username} />
      <p>{msg.username}: {msg.content}</p>
    </div>
  {/each}
</div>
