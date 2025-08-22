<script lang="ts">
  import { page } from '$app/state';
  import type { MinecraftServerOperator } from '$lib/minecraft-server/types';
  import utils from '$lib/utils';
  import { onMount } from 'svelte';

  let operators: Array<{ name: string; uuid?: string; }> = [];

  $: playerList = operators.map((x) => ({ ...x, color: uuidColor(x.uuid || x.name) }));
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

    type APIResponse = { success: boolean; message: string; data: MinecraftServerOperator[] };
    const response: APIResponse = await fetch('/api/operators/', {
      method: 'POST',
      body: JSON.stringify({ username }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(r => r.json());

    // Toast the message
    console.log(response);

    if (response.success) {
      operators = response.data;
      if (usernameInput) {
        usernameInput.value = '';
      }
    }
  }

  async function onRemove(player: string) {
    if (!player) return;
    if (!confirm(`Are you sure you want to remove ${player} from the operator?`)) return;

    const response = await fetch('/api/operators/', {
      method: 'DELETE',
      body: JSON.stringify({ username: player }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(r => r.json());

    // Toast the message
    console.log(response);

    if (response.success) {
      operators = response.data;
    }
  }

  onMount(() => {
    operators = page.data.operators || [];
  });
</script>

<section>
  <h2 class="notable-fnt">Operator Management</h2>
  <div class="operator-status">
    <h3>Server Operators</h3>
    <ul id="operators">
      {#if playerList.length > 0}
        {#each playerList as player}
          <li style="--user-color: {player.color}">
            <span>{player.name}</span>
            <button class="remove std-btn" onclick={() => onRemove(player.name)}>Remove</button>
          </li>
        {/each}
      {:else}
        <li>No operators found.</li>
      {/if}
    </ul>
  </div>
  <form method="POST" action="/api/operator/" onsubmit={onSubmit}>
    <input class="std-input" type="text" name="username" bind:this={usernameInput} placeholder="Enter username" required>
    <button class="std-btn" type="submit">Add Operator</button>
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

  .operator-status {
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
  #operators {
    list-style-type: none;
    padding: 0;
  }
  #operators li {
    display: flex;
    align-items: center;
    gap: 0.4em;
    padding: 0.6em 1em;
    &:nth-child(even) {
      background-color: #f0f0f00f;
    }
  }
  #operators li::before {
    content: "";
    display: inline-block;
    width: 0.8em;
    aspect-ratio: 1;
    border-radius: 1000px;
    background-color: var(--user-color);
  }

  #operators .remove {
    appearance: none;
    -moz-appearance: none;
    border: none;
    background-color: #898989;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
    color: #fff;
    flex-shrink: 0;
    font-size: 14px;
    margin-left: auto;
    @media (max-width: 400px) {
      font-size: 11px;
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