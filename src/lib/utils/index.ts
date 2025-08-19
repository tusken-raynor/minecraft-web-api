

export default {
  getUTCTimestamp() {
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`; // HH:MM:SS format
  },
  uuidToColor(uuid: string) {
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
}

function fnv1aHash(str: string) {
  let hash = 0x811c9dc5; // 32-bit offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime
  }
  return hash;
}

function getChannel(uuid: string, salt: string) {
  const hash = fnv1aHash(uuid + salt);
  const byte = hash & 0xff; // Use least significant byte
  return Math.floor((byte / 255) * (255 - 60) + 60); // scale to [60, 255]
}