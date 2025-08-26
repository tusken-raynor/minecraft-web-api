<script lang="ts">
  import { page } from '$app/state';
  import Resizable from '$lib/components/Resizable.svelte';
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

  let daytimeTicks = $state(-1);
  let daytimeTimerId: any = -1;
  let celestialPositions = $derived.by(() => {
    const sunAngle = (daytimeTicks + 12000) / 24000 * Math.PI * 2;
    const sunPosX = Math.cos(sunAngle) / 2 + 0.5;
    const sunPosY = Math.sin(sunAngle) / 2 + 0.5;
    const moonAngle = daytimeTicks / 24000 * Math.PI * 2;
    const moonPosX = Math.cos(moonAngle) / 2 + 0.5;
    const moonPosY = Math.sin(moonAngle) / 2 + 0.5;
    return { sunPosX, sunPosY, moonPosX, moonPosY };
  });

  async function fetchWorldTime() {
    const response = await fetch('/api/world-time').then(r => r.json());
    if (response.success) {
      const diff = response.data.ticks - daytimeTicks;
      if (diff < 0) {
        console.log(`Est. time was ahead by ${-diff} ticks`);
      } else if (diff > 0) {
        console.log(`Est. time was behind by ${diff} ticks`);
      } else {
        console.log(`Est. time is accurate`);
      }
      daytimeTicks = response.data.ticks;
    } else {
      console.warn('Failed to fetch world time:', response.message);
    }
  }

  onMount(() => {
    let startTime = Date.now();
    secTimerId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      extraSecs = Math.round(elapsed / 1000);
      if (onlineUsers.length) {
        daytimeTicks += 20;
      }
    }, 1000);

    daytimeTimerId = setInterval(fetchWorldTime, 30000);
    fetchWorldTime();
  });
  onDestroy(() => {
    clearInterval(secTimerId);
    secTimerId = -1;
    clearInterval(daytimeTimerId);
    daytimeTimerId = -1;
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
      {@const userSeconds = isOnline ? totalSeconds + extraSecs : totalSeconds}
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
{#if daytimeTicks >= 0 }
  <section class="daytime-clock" style="--sun-x:{celestialPositions.sunPosX}; --sun-y:{celestialPositions.sunPosY}; --moon-x:{celestialPositions.moonPosX}; --moon-y:{celestialPositions.moonPosY}">
    <h3 class="notable-fnt">Daytime Clock</h3>
    <Resizable className="clock" on:resize={e => e.detail.entry.target.style.setProperty('--clock-size', `${e.detail.rect.width}px`)}>
      <span class="time">{utils.minecraftTicksToClock(daytimeTicks)}</span>
      <div class="sun"></div>
      <div class="moon"></div>
    </Resizable>
  </section>
{/if}

<style lang="scss">
  :global(main) {
    display: flex;
    flex-wrap: wrap;
    gap: min(42px, 4.2vw);
    justify-content: space-between;
  }
  
  .currently-online {
    width: 100%;
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
    width: 420px;
    flex-grow: 1;
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

  .daytime-clock {
    margin-inline: auto;
    max-width: 100%;
    :global(.clock) {
      width: 220px;
      aspect-ratio: 1;
      border: 1px solid var(--color-main);
      border-radius: 1000px;
      margin-top: 16px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sun, .moon {
      height: 0;
      width: 0;
      position: absolute;
      top: 0;
      left: 0;
      transition: transform 1s linear;
      z-index: 3;
      animation: fade-in 3s linear;
    }
    .sun {
      transform: translate(calc(var(--sun-x) * var(--clock-size)), calc(var(--sun-y) * var(--clock-size)));
    }
    .moon {
      transform: translate(calc(var(--moon-x) * var(--clock-size)), calc(var(--moon-y) * var(--clock-size)));
    }

    .sun::after, .moon::after {
      content: "";
      position: absolute;
      aspect-ratio: 1;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: var(--txt-main);
      z-index: 4;
    }
    .sun::after {
      background-color: #ffd000;
      width: 30px;
      $mask: url(../../lib/assets/sun.svg) no-repeat center/contain;
      -webkit-mask: $mask;
      mask: $mask;
    }
    .moon::after {
      background-color: #e7e7e7;
      width: 23px;
      $mask: url(../../lib/assets/moon.svg) no-repeat center/contain;
      -webkit-mask: $mask;
      mask: $mask;
    }
  }

  @keyframes fade-in {
    0%, 66% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>