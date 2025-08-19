<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher();
  let open = $state(false);
  let selectedLabel = $state('');
  let selectedValue = $state('');

  function toggleOpen() {
    open = !open;
  }

  onMount(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  });
</script>

<div bind:this={container} class="select-container">
  <div class="select-label" onclick={toggleOpen} onkeydown={toggleOpen}>
    {selectedLabel || 'Select...'}
    <span class="arrow">{open ? '▲' : '▼'}</span>
  </div>
  {#if open}
    <ul class="select-list">
      <slot
        name="option"
        {selectOption}
      />
    </ul>
  {/if}
</div>

<style>
  .select-container { position: relative; width: 200px; }
  .select-label { padding: 8px; border: 1px solid #ccc; cursor: pointer; background: #fff; }
  .arrow { float: right; }
  .select-list { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #ccc; margin: 0; padding: 0; list-style: none; z-index: 10; }
</style>