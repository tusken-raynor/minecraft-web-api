<script lang="ts">
  import { page } from '$app/state';

  let textareaEl: HTMLTextAreaElement | null;
  let responseMessage = $state('');
  let responseSuccess = $state(true);

  async function onSubmit(e: Event) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    if (!data.message || !data.username) return;

    const url = data.username === 'rcon' ? '/api/say/' : '/api/msg/';
    const response: { success: boolean; message: string; } = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ username: data.username, message: data.message }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(r => r.json());

    if (textareaEl) textareaEl.value = '';

    responseMessage = response.message;
    responseSuccess = response.success;

    await new Promise(res => setTimeout(res, 3000));

    responseMessage = '';
    responseSuccess = true;
  }
</script>

<section>
  <form method="POST" action="/api/msg/" onsubmit={onSubmit}>
    <div class="std-dropdown">
      <select name="username" required>
        <option value="rcon" selected>RCON</option>
        {#each page.data.whitelisted as player}
          <option value={player.name}>{player.name}</option>
        {/each}
      </select>
    </div>
    <textarea class="std-input" name="message" bind:this={textareaEl} placeholder="Enter your message" rows="4" required></textarea><br>
    <button class="std-btn" type="submit">Send</button>
    {#if responseMessage}
      <p class="response" class:error={!responseSuccess}>{responseMessage}</p>
    {/if}
  </form>
</section>

<style lang="scss">
  .std-dropdown,
  .std-input {
    margin-bottom: 24px;
  }

  .std-input {
    width: 100%;
    max-width: 400px;
  }

  .response {
    margin-top: 1em;
    &.error {
      color: var(--color-error);
    }
  }
</style>