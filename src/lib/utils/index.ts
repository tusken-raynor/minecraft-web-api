

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
  },
  minecraftTicksToClock(ticks: number): string {
    // Minecraft day starts at 0, which we'll call 6 AM
    // So shift time by 6000 ticks to align 0 = midnight
    const shiftedTicks = (ticks + 6000) % 24000;
    const hours = Math.floor(shiftedTicks / 1000);
    const minutes = Math.floor((shiftedTicks % 1000) * 60 / 1000);

    let hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const amOrPm = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) {
      hh = String(hours - 12).padStart(2, '0');
    } else if (hours === 0) {
      hh = '12'; // Midnight case
    }

    return `${hh}:${mm} ${amOrPm}`;
  },
  secondsToHMS(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60); 
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  },
  getSecondsSinceUTCMidnight(): number {
    // Get the UTC Epoch seconds, and use modulo
    // to get the remainder, which is the number of
    // seconds since midnight
    return Math.floor((Date.now() / 1000) % 86400);
  },
  normalizeVector(...nums: number[]): number[] {
    const length = Math.sqrt(nums.reduce((sum, val) => sum + val * val, 0));
    if (length === 0) return nums.map(() => 0);
    return nums.map(val => val / length);
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