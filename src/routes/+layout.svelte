<script lang="ts">
  import Toast from "$lib/components/Toast.svelte";
  import "$lib/styles/main.scss";
  import { onMount, onDestroy } from 'svelte';

	let { children } = $props();
  let menuOpen = $state(false);

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  let resizeObserver: ResizeObserver;
  let header: HTMLElement;
  onMount(() => {
    resizeObserver = new ResizeObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        const element = entries[i].target as HTMLElement;
        element.style.setProperty('--qmc-height', `${element.clientHeight}px`);
      }
    });
    resizeObserver.observe(header);
  });
  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });
</script>

<svelte:head>
	<!-- <link rel="icon" href={favicon} /> -->
</svelte:head>

<header bind:this={header}>
  <h1 class="title notable-fnt">Minecraft Admin Dashboard</h1>
  <nav class:open={menuOpen}>
    <a href="/dashboard" onclick={toggleMenu}>Dashboard</a>
    <a href="/messaging" onclick={toggleMenu}>Messaging</a>
    <a href="/whitelist" onclick={toggleMenu}>Whitelist</a>
    <a href="/operators" onclick={toggleMenu}>Operators</a>
    <a href="/schedules" onclick={toggleMenu}>Schedules</a>
    <button class="close" onclick={toggleMenu}>Close</button>
  </nav>
  <button 
    class="toggle-menu"
    class:open={menuOpen} 
    aria-label="Toggle menu"
    onclick={toggleMenu}
  >
    <div class="pattie"></div>
    <div class="pattie"></div>
    <div class="pattie"></div>
  </button>
</header>
<main>{@render children?.()}</main>
<footer>
  <Toast />
</footer>

<style lang="scss">
  header {
    --bg-main: #55555a;
    background-color: var(--bg-main);
    box-shadow: 0 3px 16px 0 #0007;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    padding: 16px 24px;
  }
  .title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 0.4em;
    @media (max-width: 600px) {
      font-size: 16px;
    }
  }
  nav {
    position: absolute;
    top: 100%;
    right: 0;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-main);
    z-index: 1000;
    height: calc(100vh - var(--qmc-height));
    padding: 12px 0;
    box-sizing: border-box;
    width: 100vw;
    max-width: 400px;
    transform: scaleX(0);
    transition: transform 0.4s cubic-bezier(0.76, 0, 0.24, 1);
    transform-origin: right;
    &.open {
      transform: scaleX(1);
    }

    a[href] {
      color: var(--txt-main);
      padding: 8px 24px;
      display: block;
      font-size: 18px;
      opacity: 0;
      transition: background-color 0.2s linear, color 0.2s linear, opacity 0.08s linear;
      &:hover {
        background-color: var(--color-main);
        color: #fff;
      }
    }

    &.open a[href] {
      opacity: 1;
      transition: background-color 0.2s linear, color 0.2s linear, opacity 0.2s linear 0.3s;
    }
  }
  .toggle-menu {
    appearance: none;
    margin: 0;
    padding: 0;
    border: none;
    background-color: var(--color-main);
    width: 42px;
    height: 36px;
    border-radius: 4px;
    flex-shrink: 0;
    box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    display: flex;
    flex-direction: column; 
    justify-content: space-evenly;
    align-items: center;
    box-sizing: border-box;
    padding-block: 4px;
    position: relative;

    .pattie {
      width: 70%;
      height: 4px;
      background-color: #fff;
      border-radius: 100px;
    }

    &.open {
      .pattie:first-child {
        display: none;
      }
      .pattie:nth-child(2) {
        transform: rotate(45deg);
        position: absolute;
      }
      .pattie:nth-child(3) {
        transform: rotate(-45deg);
        position: absolute;
      }
    }
  }
  button.close {
    appearance: none;
    -moz-appearance: none;
    border: none;
    padding: 0;
    background-color: #0000;
    font-size: 0;
    position: absolute;
    width: calc(100vw - 100%);
    height: 100%;
    top: 0;
    right: 100%;
  }
</style>