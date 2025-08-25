<script lang="ts">
  import Resizable from '$lib/components/Resizable.svelte';
  import type { MySQLSchedulesRecord } from '$lib/db';
  import { schedules, showToast } from '$lib/stores';
  import { onMount } from 'svelte';

  let expandedSchedule = $state(-1);

  type CommandField = { name: string; type: string; required: boolean; options?: { label: string; value: string; }[] };

  const availableCommands = {
    "kick": {
      fields: [
        { name: "username", type: "text", required: true },
        { name: "reason", type: "text", required: false }
      ]
    },
    "tell": {
      fields: [
        { name: "username", type: "text", required: true },
        { name: "message", type: "textarea", required: true }
      ]
    }
  };
  const commandNames = $derived(Object.keys(availableCommands));
  let selectedCommand = $state<keyof typeof availableCommands | "">("");
  let commandFields = $derived(selectedCommand ? groupFields(availableCommands[selectedCommand].fields || []) : []);

  $effect(() => {
    console.log("Command fields updated:", commandFields, selectedCommand, selectedCommand ? availableCommands[selectedCommand].fields : []);
  });

  function groupFields(fields: CommandField[]) {
    // Group smaller sized fields in pairs of two, make sure textareas are in their own group
    const groupable = ["text", "number", "select"];
    const grouped: CommandField[][] = [];

    let i = 0;
    while (i < fields.length) {
      const field = fields[i];
      const group: CommandField[] = [field];
      if (groupable.includes(field.type)) {
        const nextField = fields[i + 1];
        if (groupable.includes(nextField.type)) {
          group.push(nextField);
          i++;
        }
      }
      if (group.length) {
        grouped.push(group);
      }
      i++;
    }

    return grouped;
  }

  async function onSubmit(e: Event) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);

    type APIResponse = { success: boolean; message: string; data: MySQLSchedulesRecord; };
    const response: APIResponse = await fetch('/api/schedules/', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(r => r.json());

    // Toast the message
    showToast(
      response.success ?
        { title: "Success", message: `Scheduled command has been added.` } :
        { title: "Error", message: response.message || "Unknown error" },
      response.success ? 'success' : 'error',
      5000
    );

    if (response.success) {
      schedules.set([...$schedules, response.data]);

      // Clear all the form fields
      e.target && (e.target as HTMLFormElement).reset();
      selectedCommand = "";
    }
  }

  async function onRemove(schedule: number) {
    if (!confirm(`Are you sure you want to remove schedule ${schedule} from the list?`)) return;

    const response = await fetch('/api/schedules/', {
      method: 'DELETE',
      body: JSON.stringify({ id: schedule }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(r => r.json());

    // Toast the message
    showToast(
      response.success ?
        { title: "Success", message: `Scheduled command with ID: ${schedule} has been removed.` } :
        { title: "Error", message: response.message || "Unknown error" },
      response.success ? 'success' : 'error',
      5000
    );

    if (response.success) {
      // Remove the schedule from the list
      schedules.set($schedules.filter(s => s.id !== schedule));
    }
  }

  function onWrapperResize(event: CustomEvent<{ entry: ResizeObserverEntry; rect: DOMRectReadOnly; }>) {
    // Apply the new height to a css custom prop on the parent
    const parent = event.detail.entry.target.parentElement;
    if (parent) {
      parent.style.setProperty('--wrapper-height', `${event.detail.rect.height}px`);
    }
  }

  onMount(async () => {
    if ($schedules.length === 0) {
      // Fetch the schedule list from the API
      const response = await fetch('/api/schedules/').then(r => r.json());
      if (response.success) {
        schedules.set(response.data);
      } else {
        schedules.set([]);
      }
    }
  });
</script>

<section>
  <h2 class="notable-fnt">Manage Schedules</h2>
  <div class="schedules-status">
    <h3>Scheduled Commands</h3>
    <ul id="schedules">
      {#if $schedules.length > 0}
        {#each $schedules as schedule}
          <li class:expanded={expandedSchedule === schedule.id} data-id={schedule.id}>
            <div class="head">
              <span class="name">Command: <strong>{schedule.name.toUpperCase()}</strong></span> <span class="author">Author: {schedule.author}</span>
              <button 
                class="more std-btn" 
                onclick={() => expandedSchedule = expandedSchedule === schedule.id ? -1 : schedule.id}
              >{expandedSchedule === schedule.id ? 'Less' : 'More'}</button>
            </div>
            <div class="body">
              <Resizable className="details" on:resize={onWrapperResize}>
                <p class="author-detail"><strong>Author:</strong> {schedule.author}</p>
                <p class="command-detail"><strong>Full Command:</strong> <span class="command-value">{schedule.command}</span></p>
                <p><strong>Description:</strong> {schedule.description}</p>
                <p><strong>Cron Expression:</strong> {schedule.cron}</p>
                <p><strong>Created At:</strong> {new Date(schedule.created_at).toLocaleString()}</p>
                <p><strong>Updated At:</strong> {new Date(schedule.updated_at).toLocaleString()}</p>
                <button class="std-btn remove" onclick={() => onRemove(schedule.id)}>Remove</button>
              </Resizable>
            </div>
          </li>
        {/each}
      {:else}
        <li>No schedules found.</li>
      {/if}
    </ul>
  </div>
  <form method="POST" action="/api/schedules/" onsubmit={onSubmit}>
    <h3>Create Scheduled Command</h3>
    <p>Schedules are based in <strong>EST</strong>.</p>
    <div class="command-select std-dropdown">
      <select name="command" bind:value={selectedCommand} required>
        <option value="" disabled selected>Select a command</option>
        {#each commandNames as command}
          <option value={command}>{command.toUpperCase()}</option>
        {/each}
      </select>
    </div>
    <!-- Dynamic fields based on selected command will go here -->
    {#if selectedCommand}
      {#each commandFields as group}
        <div class="input-group">
          {#each group as field}
            {#if field.type === 'text'}
              <input 
                type="text" 
                name={field.name} 
                id={field.name} 
                class="std-input" 
                placeholder={`Enter ${field.name}`} 
                required={field.required} 
              >
            {:else if field.type === 'select' && field.options}
              <select 
                name={field.name} 
                id={field.name} 
                class="std-input" 
                required={field.required}
              >
                <option value="" disabled selected>Select an option</option>
                {#each field.options as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            {:else if field.type === 'textarea'}
              <textarea 
                name={field.name} 
                id={field.name} 
                class="std-input" 
                placeholder={`Enter ${field.name}`} 
                required={field.required} 
                rows="3"
              ></textarea>
            {/if}
          {/each}
        </div>
      {/each}
    {/if}
    <div class="input-group">
      <input type="text" name="cron" id="cron" class="std-input" placeholder="Enter cron expression" required>
      <input type="text" name="author" id="author" class="std-input" placeholder="Enter author name" required>
    </div>
    <textarea name="description" id="description" class="std-input" placeholder="Enter description" required rows="4"></textarea>
    <button class="std-btn" type="submit">Schedule Command</button>
  </form>
</section>

<style lang="scss">
  section {
    display: flex;
    flex-wrap: wrap-reverse;
    align-items: flex-end;
    gap: 1.5em;
  }

  h2 {
    font-size: 18px;
    width: 100%;
    order: 3;
  }

  h3 {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .schedules-status {
    flex-grow: 1;
    @media (max-width: 700px) {
      width: 100%;
    }
  }
  #schedules {
    list-style-type: none;
    padding: 0;
    
    li {
      padding: 0.6em 1em;
      transition: background-color 0.2s linear;
      &:nth-child(even) {
        background-color: #f0f0f00f;
      }
      &.expanded {
        background-color: #f0f0f02a;
      }

      .head {
        display: flex;
        align-items: center;
        gap: 0.4em;
      }
      .name {
        color: var(--color-main);
        margin-right: 1em;
      }
      .author {
        font-weight: 300;
        @media (max-width: 500px) {
          display: none;
        }
      }

      .body {
        overflow: hidden;
        height: var(--wrapper-height);
        position: relative;
        transition: height 0.35s ease;

        p {
          margin-bottom: 0.7em;
          &.author-detail {
            @media (min-width: 501px) {
              display: none;
            }
          }
        }
      }
      &:not(.expanded) .body {
        height: 0px;
      }

      :global(.details) {
        box-sizing: border-box;
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;

        &::before, &::after {
          content: "";
          display: block;
        }
        &::before {
          height: 24px;
        }
        &::after {
          height: 16px;
        }
      }

      .command-detail {
        display: flex;
        align-items: center;
        gap: 0.3em;
        flex-wrap: wrap;
      }
      .command-value {
        font-family: monospace;
        font-size: 0.9em;
        background-color: #f0f0f0;
        padding: 2px 4px;
        border-radius: 4px;
        color: #444;
      }

      .remove {
        background-color: #898989;
        font-size: 14px;
      }
    }

    .more {
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
  }

  form {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    gap: 0.4em;
    width: 480px;
    max-width: 100%;

    .input-group {
      display: flex;
      gap: 0.4em;
      flex-wrap: wrap;
      width: 100%;
    }
    input {
      flex: 1 1 180px;
      min-width: 180px;
    }

    .command-select {
      width: 100%;
      select {
        width: 100%;
      }
    }
    textarea {
      width: 100%;
    }
  }
</style>