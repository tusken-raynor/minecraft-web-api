<script lang="ts">
  import { page } from '$app/state';

  function onSubmit(e: Event) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    if (!data.message || !data.username) return;

    const url = data.username === 'rcon' ? '/api/say/' : '/api/msg/';
    fetch(url, {
      method: 'POST',
      body: JSON.stringify({ username: data.username, message: data.message }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
</script>

<section>
  <form method="POST" action="/api/msg/" on:submit={onSubmit}>
    <div class="std-dropdown">
      <select name="username" required>
        <option value="rcon" selected>RCON</option>
        {#each page.data.whitelisted as player}
          <option value={player.name}>{player.name}</option>
        {/each}
      </select>
    </div>
    <textarea class="std-input" name="message" placeholder="Enter your message" rows="4" required></textarea><br>
    <button class="std-btn" type="submit">Send</button>
    <p class="response empty"></p>
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
</style>