<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { observe, unobserve } from "$lib/resizeObserver";

  export let className: string = "";

  const dispatch = createEventDispatcher();
  let el: HTMLElement;

  onMount(() => {
    observe(el, (entry: ResizeObserverEntry) => {
      dispatch("resize", { entry, rect: entry.contentRect });
    });
  });

  onDestroy(() => {
    if (el) unobserve(el);
  });
</script>

<div bind:this={el} class={className}>
  <slot />
</div>
