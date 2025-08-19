<script lang="ts">
  import { page } from '$app/state';
  import utils from '$lib/utils';
  import { onDestroy, onMount } from 'svelte';

  const onlineUsers: string[] = page.data.onlineUsers;
  const userIndex: Record<string, { name: string; uuid?: string; color: string }> = 
    page.data.whitelisted.reduce((a: Record<string, { name: string; uuid?: string; color: string }>, x: { name: string; uuid?: string }) => {
      a[x.name] = { ...x, color: uuidColor(x.uuid || x.name) };
      return a;
    }, {});
  const playtimeData: Array<{ user: string; playtime: string; totalSeconds: number; isOnline: boolean; }> = page.data.playtime;

  let extraSecs = $state(0);
  let secTimerId: any = -1;

  function uuidColor(uuid: string): string {
    const { r, g, b } = utils.uuidToColor(uuid);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function toTimeStamp(secs: number) {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  onMount(() => {
    let startTime = Date.now();
    secTimerId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      extraSecs = Math.round(elapsed / 1000);
    }, 1000);
  });
  onDestroy(() => {
    clearInterval(secTimerId);
    secTimerId = -1;
  });
</script>
<section class="currently-online">
  <h3 class="notable-fnt">Currently Online Players <span class="lato-fnt">({onlineUsers.length}):</span></h3>
  <p id="online-players">
    {#if onlineUsers.length > 0}
      {#each onlineUsers as player, index}
        <span class="online-player" style="--user-color:{userIndex[player].color}">{player}</span>{index < onlineUsers.length - 1 ? ', ' : ''}
      {/each}
    {:else}
      <span>No players currently online.</span>
    {/if}
  </p>
</section>
<section class="playtime-graph">
  <h3 class="notable-fnt">Playtime Graph <span class="lato-fnt">(UTC Day)</span></h3>
  <div id="utc-graph">
    {#each playtimeData.toSorted((a, b) => b.totalSeconds - a.totalSeconds) as { user, totalSeconds, isOnline }}
      {@const userSeconds = totalSeconds + extraSecs}
      <div class="bar {isOnline ? 'online' : ''}" style="--alpha:{userSeconds / 86400}; --user-color:{userIndex[user].color}">
        <span class="cs-user">{user}</span>
        <span class="cs-pt">{toTimeStamp(userSeconds)}</span>
      </div>
    {/each}
  </div>
  <div class="time-scale">
    <span>0h</span>
    <span>06h</span>
    <span>12h</span>
    <span>18h</span>
    <span>24h</span>
  </div>
</section>

<style lang="scss">
  section {
    padding-bottom: 42px;
  }
  .currently-online {
    h3 {
      font-weight: 900;
    }

    .online-player {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
    }
    .online-player::before {
      content: "";
      display: inline-block;
      width: 0.8em;
      aspect-ratio: 1;
      border-radius: 1000px;
      background-color: var(--user-color);
    }
  }

  .playtime-graph {
    width: 800px;
    max-width: 100%;
  }
  #utc-graph {
    background-color: #55555a;
    padding-block: 16px;
    margin-top: 16px;
    border: 1px solid var(--txt-main);
    border-radius: 4px;
  }
  #utc-graph .bar {
    padding: 0.4em 0.9em;
    isolation: isolate;
    position: relative;
    background-color: #fff4;
    border-bottom: 1px solid #333;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  #utc-graph .bar.online {
    background-color: #fff9;
  }
  #utc-graph .bar:not(:last-child) {
    margin-bottom: 12px;
  }
  #utc-graph .bar > span {
    color: #000;
  }
  #utc-graph .bar .cs-user {
    font-weight: 700;
  }
  #utc-graph .bar .cs-pt {
    font-size: 13px;
  }
  #utc-graph .bar::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: -1;
    background-color: var(--user-color);
    width: calc(100% * var(--alpha));
  }
  .time-scale {
    display: flex;
    justify-content: space-between;
    color: var(--color-main);
    font-weight: 600;
  }
</style>