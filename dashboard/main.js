document.addEventListener('DOMContentLoaded', async () => {
  const host = 'http://mc.mooseengine.com:52341';
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
  
  console.log('Online Players:', players);
  console.log('Whitelisted Players:', whitelisted);
  console.log('Operators:', operators);
  console.log('Playtimes:', playtimes);
});

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
  ].filter(c => c.value > 200);

  if (high.length > 0) {
    const brightest = high[0].key;

    if (brightest !== 'r') r = Math.min(r, 200);
    if (brightest !== 'g') g = Math.min(g, 200);
    if (brightest !== 'b') b = Math.min(b, 200);
  }

  return { r, g, b };
}
