const host = 'http://mc.mooseengine.com:52341';

document.addEventListener('DOMContentLoaded', async () => {
  // Load the main content of the page
  await downloadPageContent();
  // Setup messaging functionality
  setupMessaging();
});

async function downloadPageContent() {
  // Get the players that are currently online
  const onlinePlayersPr = fetch(`${host}/api/players`)
    .then(response => response.json());
  const whitelistedPr = fetch(`${host}/api/whitelist`)
    .then(response => response.json());
  const operatorsPr = fetch(`${host}/api/operators`)
    .then(response => response.json());
  const playtimesPr = fetch(`${host}/api/players/playtime`)
    .then(response => response.json());

  const [players, whitelisted, operators, playtimes] = await Promise.all([
    onlinePlayersPr,
    whitelistedPr,
    operatorsPr,
    playtimesPr
  ]);

  // Create a color key for players
  const playerColorKey = {};
  whitelisted.data.forEach(player => {
    const color = uuidToColor(player.uuid);
    playerColorKey[player.name] = `rgb(${color.r}, ${color.g}, ${color.b})`;
  });

  // Populate the online players list
  const onlinePlayersList = document.getElementById('online-players');
  if (onlinePlayersList) {
    if (players.success) {
      onlinePlayersList.innerHTML = players.data.playerCount ? players.data.players.map(player => {
        const color = playerColorKey[player] || 'black';
        return `<span class="online-player" style="--user-color: ${color};">${player}</span>`;
      }).join(', ') : '<span class="no-players">No players online</span>';
    } else {
      console.error('Failed to fetch online players:', players.message);
      onlinePlayersList.innerHTML = `<span class="error">${players.message}</span>`;
    }
  }

  // Populate the playtime graph
  const playtimeGraph = document.getElementById('utc-graph');
  if (playtimeGraph) {
    if (playtimes.success && playtimes.data?.length) {
      const secondsIn24Hours = 24 * 60 * 60;

      // Create a simple bar graph
      playtimeGraph.innerHTML = playtimes.data.toSorted((a, b) => b.totalSeconds - a.totalSeconds).map(player => {
        const color = playerColorKey[player.user] || 'gray';
        return `<div class="bar" style="--alpha: ${player.totalSeconds / secondsIn24Hours}; --user-color: ${color};" title="${player.user}: ${player.playtime}"><span>${player.user}</span></div>`;
      }).join('');
    } else {
      playtimeGraph.classList.add('hidden');
    }
  }

  // Populate the messaging source select list
  const messagingSourceSelect = document.querySelector('.message-as');
  if (messagingSourceSelect) {
    // Add all the usernames as message sources
    const options = Object.keys(playerColorKey).map(name => {
      const color = playerColorKey[name];
      return `<option value="${name}" style="color: ${color};">${name}</option>`;
    }).join('');
    messagingSourceSelect.innerHTML += options;
  }

  // Polulate the whitelisted players list
  const whitelistList = document.getElementById('whitelisted-players');
  if (whitelistList) {
    if (whitelisted.success) {
      whitelistList.innerHTML = '';
      whitelisted.data.forEach(player => {
        const color = playerColorKey[player.name] || 'black';
        const listItem = document.createElement('li');
        listItem.innerHTML = `${player.name} <span class="remove" data-uuid="${player.name}"></span>`;
        listItem.style.setProperty('--user-color', color);
        whitelistList.appendChild(listItem);
      });
    } else {
      console.error('Failed to fetch whitelisted players:', whitelisted.message);
      whitelistList.innerHTML = `<li class="error">${whitelisted.message}</li>`;
    }
  }

  // Populate the operators list
  const operatorsList = document.getElementById('operators-list');
  if (operatorsList) {
    if (operators.success) {
      operatorsList.innerHTML = '';
      operators.data.forEach(operator => {
        const color = playerColorKey[operator.name] || 'black';
        const listItem = document.createElement('li');
        listItem.innerHTML = `${operator.name} <span class="deop" data-uuid="${operator.name}"></span>`;
        listItem.style.setProperty('--user-color', color);
        operatorsList.appendChild(listItem);
      });
    } else {
      console.error('Failed to fetch operators:', operators.message);
      operatorsList.innerHTML = `<li class="error">${operators.message}</li>`;
    }
  }
}

function setupMessaging() {
  const messageForm = document.querySelector('#messaging form');
  if (!messageForm) return;

  const btn = messageForm.querySelector('button');
  const messageInput = messageForm.querySelector('textarea');
  const messageAs = messageForm.querySelector('.message-as');
  const responseEl = messageForm.querySelector('.response');

  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = 'Sending...';

    const message = messageInput.value.trim();
    const source = messageAs.value;

    if (!message) {
      alert('Message cannot be empty');
      btn.disabled = false;
      btn.textContent = 'Send';
      return;
    }

    const endpoint = `${host}/api/${source == 'rcon' ? 'say' : 'msg'}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, username: source })
      });

      const result = await response.json();
      messageInput.value = '';
      responseEl.textContent = result.message;
      responseEl.classList.toggle('empty', !!result.message);
      responseEl.classList.toggle('error', !result.success);
    } catch (error) {
      console.error('Error sending message:', error);
      responseEl.textContent = 'Failed to send message. Please try again.';
      responseEl.classList.add('error');
      responseEl.classList.remove('empty');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send';
      setTimeout(() => {
        responseEl.textContent = '';
        responseEl.classList.add('empty');
        responseEl.classList.remove('error');
      }, 5000); // Clear response after 5 seconds
    }
  });
}

function fnv1aHash(str) {
  let hash = 0x811c9dc5; // 32-bit offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime
  }
  return hash;
}

function getChannel(uuid, salt) {
  const hash = fnv1aHash(uuid + salt);
  const byte = hash & 0xff; // Use least significant byte
  return Math.floor((byte / 255) * (255 - 60) + 60); // scale to [60, 255]
}

function uuidToColor(uuid) {
  const clean = uuid.replace(/-/g, '');

  let r = getChannel(clean, 'R');
  let g = getChannel(clean, 'G');
  let b = getChannel(clean, 'B');

  const high = [
    { key: 'r', value: r },
    { key: 'g', value: g },
    { key: 'b', value: b },
  ].sort((a, b) => a.value - b.value).filter(c => c.value > 200);

  if (high.length > 0) {
    const brightest = high[0].key;

    if (brightest !== 'r') r = Math.round(r * 0.6);
    if (brightest !== 'g') g = Math.round(g * 0.6);
    if (brightest !== 'b') b = Math.round(b * 0.6);
  }

  return { r, g, b };
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}