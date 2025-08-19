import { json } from '@sveltejs/kit';
import minecraftServer from '$lib/minecraft-server';

export async function GET() {
  if (!minecraftServer.isConnected()) {
    return json({ success: false, message: 'Minecraft server not connected' }, { status: 503 });
  }
  try {
    const response = await minecraftServer.timeGet();
    const match = response.raw.match(/\d+/);
    if (!match) {
      return json({ success: false, message: 'Could not parse time' }, { status: 500 });
    }

    const ticks = parseInt(match[0], 10);
    const clockTime = minecraftTicksToClock(ticks);
    return json({ success: true, data: { ticks, time: clockTime } });
  } catch (err) {
    console.error(err);
    return json({ success: false, message: 'Failed to query Minecraft time' }, { status: 500 });
  }
}

export async function POST({ request }) {
  if (!minecraftServer.isConnected()) {
    return json({ success: false, message: 'Minecraft server not connected' }, { status: 503 });
  }

  const body = await request.json();
  const time = body?.time;

  if (!time) {
    return json({ success: false, message: 'Time is required' }, { status: 400 });
  }

  try {
    const response = await minecraftServer.timeSet(time);
    return json({ success: true, message: response.raw }, { status: 200 });
  } catch (error) {
    console.error('Error setting time:', error);
    return json({ success: false, message: 'Failed to set Minecraft time' }, { status: 500 });
  }
}

function minecraftTicksToClock(ticks: number): string {
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
}