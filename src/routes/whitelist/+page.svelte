<script lang="ts">
  import { page } from '$app/state';
  import { showToast } from '$lib/stores';
  import utils from '$lib/utils';
  import { onMount } from 'svelte';

  let whitelisted: Array<{ name: string; uuid?: string; }> = [];

  $: playerList = whitelisted.map((x) => ({ ...x, color: uuidColor(x.uuid || x.name) }));
  let usernameInput: HTMLInputElement | null;

  function uuidColor(uuid: string): string {
    const { r, g, b } = utils.uuidToColor(uuid);
    return `rgb(${r}, ${g}, ${b})`;
  }

  async function onSubmit(e: Event) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get('username')?.toString().trim();
    if (!username) return;

    const response = await fetch('/api/whitelist/', {
      method: 'POST',
      body: JSON.stringify({ username }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(r => r.json());

    // Toast the message
    showToast(
      response.success ?
        { title: "Player whitelisted", message: `${username} has been added to the whitelist.` } :
        { title: "Error whitelisting player", message: response.message || "Unknown error" },
      response.success ? 'success' : 'error',
      5000
    );

    // The data from response should have the updated whitelist
    if (response.success) {
      whitelisted = response.data;
      if (usernameInput) {
        usernameInput.value = '';
      }
    }
  }

  async function onRemove(player: string) {
    if (!player) return;
    if (!confirm(`Are you sure you want to remove ${player} from the whitelist?`)) return;
    const response = await fetch('/api/whitelist/', {
      method: 'DELETE',
      body: JSON.stringify({ username: player }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(r => r.json());
    // Toast the message
    showToast(
      response.success ?
        { title: "Player removed from whitelist", message: `${player} has been removed from the whitelist.` } :
        { title: "Error", message: response.message || "Unknown error" },
      response.success ? 'success' : 'error',
      5000
    );

    // The data from response should have the updated whitelist
    if (response.success) {
      whitelisted = response.data;
    }
  }

  async function onKick(player: string) {
    if (!player) return;
    const response = await fetch('/api/kick/', {
      method: 'POST',
      body: JSON.stringify({ username: player }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(r => r.json());
    // Toast the message
    showToast(
      response.success ?
        { title: "Player kicked", message: `${player} has been kicked from the server.` } :
        { title: "Error", message: response.message || "Unknown error" },
      response.success ? 'success' : 'error',
      5000
    );
  }

  onMount(() => {
    whitelisted = page.data.whitelisted || [];
  });
</script>

<section>
  <h2 class="notable-fnt">Whitelist Management</h2>
  <div class="whitelist-status">
    <h3>Whitelisted Players</h3>
    <ul id="whitelisted-players">
      {#if playerList.length > 0}
        {#each playerList as player}
          <li style="--user-color: {player.color}">
            <span>{player.name}</span>
            <button class="remove std-btn" onclick={() => onRemove(player.name)}>Remove</button>
            <button class="kick std-btn" onclick={() => onKick(player.name)}>Kick</button>
          </li>
        {/each}
      {/if}
    </ul>
  </div>
  <form method="POST" action="/api/whitelist/" onsubmit={onSubmit}>
    <input class="std-input" type="text" name="username" bind:this={usernameInput} placeholder="Enter username" required>
    <button class="std-btn" type="submit">Add to Whitelist</button>
  </form>
</section>

<style lang="scss">
  section {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 1.5em;
    @media (max-width: 700px) {
      flex-direction: column;
    }
  }

  h2 {
    font-size: 18px;
    margin-bottom: 1.5em;
    width: 100%;
  }

  .whitelist-status {
    flex-grow: 1;
    @media (max-width: 700px) {
      width: 100%;
    }

    h3 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
    }
  }
  #whitelisted-players {
    list-style-type: none;
    padding: 0;
  }
  #whitelisted-players li {
    display: flex;
    align-items: center;
    gap: 0.4em;
    padding: 0.6em 1em;
    &:nth-child(even) {
      background-color: #f0f0f00f;
    }
  }
  #whitelisted-players li::before {
    content: "";
    display: inline-block;
    width: 0.8em;
    aspect-ratio: 1;
    border-radius: 1000px;
    background-color: var(--user-color);
  }

  #whitelisted-players {
    .remove {
      background-color: #898989;
      flex-shrink: 0;
      font-size: 14px;
      margin-left: auto;
      @media (max-width: 400px) {
        font-size: 11px;
      }
    }
    .kick {
      background-color: var(--color-error);
      flex-shrink: 0;
      font-size: 14px;
      @media (max-width: 400px) {
        font-size: 11px;
      }
    }
  }

  form {
    display: flex;
    align-items: center;
    gap: 0.4em;
    @media (max-width: 900px) and (min-width: 701px), (max-width: 450px) {
      flex-direction: column;
      margin-top: 32px;
      align-items: flex-start;
    }
  }
</style>