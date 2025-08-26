import { json } from '@sveltejs/kit';
import minecraftServer from '$lib/minecraft-server';
import utils from '$lib/utils';

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
    const clockTime = utils.minecraftTicksToClock(ticks);
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

