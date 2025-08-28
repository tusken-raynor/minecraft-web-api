<script lang="ts">
  import { page } from '$app/state';
  import Resizable from '$lib/components/Resizable.svelte';
  import type { MinecraftUserSessionsInfo } from '$lib/minecraft-server/types';
  import utils from '$lib/utils';
  import { onDestroy, onMount } from 'svelte';

  const onlineUsers: string[] = page.data.onlineUsers;
  const userIndex: Record<string, { name: string; uuid?: string; color: string }> = 
    page.data.whitelisted.reduce((a: Record<string, { name: string; uuid?: string; color: string }>, x: { name: string; uuid?: string }) => {
      a[x.name] = { ...x, color: uuidColor(x.uuid || x.name) };
      return a;
    }, {});
  const playSessions = (page.data.sessions as MinecraftUserSessionsInfo[])
    .toSorted((a, b) => b.totalSeconds - a.totalSeconds)
    .map(x => {
      return { ...x, sessions: x.sessions.map(s => {
        return { 
          ...s, 
          diffStart: diffPeriodSeconds(s.startTime),  
          diffEnd: diffPeriodSeconds(s.endTime)
        };
      }) };
    });
  
  function diffPeriodSeconds(time: number, period = 86400) {
    const now = Math.floor(Date.now() / 1000);
    const diff = (now - time);
    return diff;
  }

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
    const angle = daytimeTicks / 24000 * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    const sunX = -x;
    const sunY = -y;
    const moonX = x;
    const moonY = y;
    return { sunX, sunY, moonX, moonY };
  });

  async function fetchWorldTime() {
    const response = await fetch('/api/world-time').then(r => r.json());
    if (response.success) {
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
    {#each playSessions as { user, totalSeconds, isOnline, sessions }}
      {@const userSeconds = isOnline ? totalSeconds + extraSecs : totalSeconds}
      <div class="bar {isOnline ? 'online' : ''}" data-seconds={userSeconds} style="--user-color:{userIndex[user].color}">
        <span class="cs-user">{user}</span>
        <span class="cs-pt">{toTimeStamp(userSeconds)}</span>
        {#each sessions as session}
          {@const sessionSeconds = (session.active ? (session.endTime + extraSecs) : session.endTime) - session.startTime}
          <div 
            class="session" 
            title={`Session: ${toTimeStamp(sessionSeconds)} (${new Date(session.startTime * 1000).toLocaleString()} - ${session.active ? 'Now' : new Date(session.endTime * 1000).toLocaleString()})`}
            style="--start: {session.diffStart + extraSecs}; --end: {session.active ? 0 : (session.diffEnd + extraSecs)};"
          ></div>
        {/each}
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
  <section class="daytime-clock" style={Object.entries(celestialPositions).map(([key, value]) => `--${key}: ${value};`).join(' ')}>
    <h3 class="notable-fnt">Daytime Clock</h3>
    <Resizable className="clock" on:resize={e => e.detail.entry.target.style.setProperty('--clock-size', `${e.detail.rect.width}px`)}>
      <span class="time">{utils.minecraftTicksToClock(daytimeTicks)}</span>
      <div class="sun"></div>
      <div class="moon"></div>
    </Resizable>
  </section>
{/if}

<style lang="scss">
  @property --sunX {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
  }
  @property --sunY {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
  }
  @property --moonX {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
  }
  @property --moonY {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
  }

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
    overflow: auto;
    direction: rtl;
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
    order: 1;
  }
  #utc-graph .bar .cs-pt {
    font-size: 13px;
  }
  #utc-graph .session {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: -1;
    background-color: var(--user-color);
    right: calc(var(--end) / 86400 * 100%);
    left: calc(100% - (var(--start) / 86400 * 100%));
  }
  .time-scale {
    display: flex;
    justify-content: space-between;
    color: var(--color-main);
    font-weight: 600;
  }

  .daytime-clock {
    max-width: 100%;
    @media (max-width: 715px) {
      flex-basis: 100%;
    }

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
      margin-inline: auto;
    }

    .sun, .moon {
      height: 0;
      width: 0;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 3;
      transition: --sunX 1s linear, --sunY 1s linear, --moonX 1s linear, --moonY 1s linear;
      animation: fade-in 3s linear;
      $count: 5;
      @for $i from 0 through $count {
        @if $i == $count {
          --length: calc(0.5 * (var(--x#{$i - 1}) + var(--get-sqrt) / var(--x#{$i - 1})));
        } @else if $i == 0 {
          --x0: 1;
        } @else {
          --x#{$i}: calc(0.5 * (var(--x#{$i - 1}) + var(--get-sqrt) / var(--x#{$i - 1})));
        }
      }
    }
    .sun {
      // transform: rotate(var(--sun-angle)) translateX(calc(var(--clock-size) * 0.5)) rotate(calc(var(--sun-angle) * -1));
      --get-sqrt: calc(var(--sunX) * var(--sunX) + var(--sunY) * var(--sunY));
      --x: calc((var(--sunX) / var(--length) + 1) / 2);
      --y: calc((var(--sunY) / var(--length) + 1) / 2);
      transform: translate(calc(var(--x) * var(--clock-size)), calc(var(--y) * var(--clock-size)));
    }
    .moon {
      // transform: rotate(var(--moon-angle)) translateX(calc(var(--clock-size) * 0.5)) rotate(calc(var(--moon-angle) * -1));
      --get-sqrt: calc(var(--moonX) * var(--moonX) + var(--moonY) * var(--moonY));
      --x: calc(var(--moonX) / var(--length) / 2 + 0.5);
      --y: calc(var(--moonY) / var(--length) / 2 + 0.5);
      transform: translate(calc(var(--x) * var(--clock-size)), calc(var(--y) * var(--clock-size)));
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