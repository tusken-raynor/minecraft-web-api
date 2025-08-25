<script lang="ts">
  import { clearToast, toastContent, toastStatus, toastTime } from '$lib/stores';

  let noAnim = $state(false);
  let retreat = $state(false);

  let timerId: any = $state(-1);

  toastContent.subscribe((value) => {
    if (typeof requestAnimationFrame === "undefined") return;
    if (!value) return;

    clearTimeout(timerId);
    requestAnimationFrame(() => {
      timerId = setTimeout(closeToast, $toastTime);
    });
  });

  function closeToast() {
    noAnim = true;
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      retreat = true;
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        noAnim = false;
        retreat = false;
        clearToast();
        timerId = -1;
      }, 400);
    }, 100);
  }
</script>

{#if $toastContent}
  <div class="toast {$toastStatus}" class:retreat={retreat} class:no-anim={noAnim}>
    {#if $toastContent.title}
      <h2>{$toastContent.title}</h2>
    {/if}
    <p>{$toastContent.message}</p>
    <button class="close" onclick={closeToast}>close</button>
  </div>
{/if}

<style lang="scss">
  .toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    min-width: 200px;
    padding: 1.5em 1.8em;
    border-radius: 8px;
    background-color: var(--bg-main);
    color: var(--txt-main);
    font-weight: 500;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.3);
    transition: opacity 0.2s linear 0.16s, transform 0.4s cubic-bezier(0.76, 0, 0.24, 1);
    z-index: 1000;
    isolation: isolate;
    overflow: hidden;
    min-width: 300px;
    max-width: min(calc(100vw - 4rem), 400px);
    box-sizing: border-box;

    &:not(.no-anim) {
      animation: slide-in 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    }
    &.retreat {
      transform: translateX(100%);
      opacity: 0;
    }
    &.success { --toast-color: var(--color-main); }
    &.error { --toast-color: #e74c3c; }
    &.warning { --toast-color: #f39c12; }
    &.info { --toast-color: #3498db; }

    > * {
      position: relative;
      z-index: 1;
    }

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background-color: #fff2;
    }
    &::after {
      content: "";
      position: absolute;
      inset: 3px;
      border-radius: inherit;
      border: 3px solid var(--toast-color);
      z-index: 2;
    }
  }

  h2 {
    margin-bottom: 0.5em;
    margin-top: -0.3em;
    font-size: 1.2em;
    font-weight: 800;
    color: var(--toast-color);
  }

  .close {
    position: absolute;
    font-size: 0;
    right: 8px;
    top: 8px;
    appearance: none; 
    padding: 0;
    background-color: var(--toast-color);
    border: none;
    width: 1rem;
    aspect-ratio: 1;
    border-radius: 100px;
    cursor: pointer;
    z-index: 4;
    box-shadow: 0 0 0px rgba(0,0,0,0);
    transition: box-shadow 0.2s linear;
    &:hover {
      box-shadow: 0 1px 6px rgba(0,0,0,0.3);
    }

    &::before, &::after {
      content: "";
      position: absolute;
      top: calc(50% - 1px);
      left: 20%;
      width: 62%;
      height: 2px;
      background-color: #fff;
      transform-origin: center;
    }
    &::before {
      transform: rotate(45deg);
    }
    &::after {
      transform: rotate(-45deg);
    }
  }

  @keyframes slide-in {
    0% {
      transform: translateX(100%);
      opacity: 0;
    }
    25% {
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>