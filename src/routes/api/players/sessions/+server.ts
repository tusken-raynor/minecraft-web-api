import minecraftServer from '$lib/minecraft-server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    let startQuery: number | undefined = start ? Number(start) : undefined;
    let endQuery: number | undefined = end ? Number(end) : undefined;
    if (startQuery !== undefined && isNaN(startQuery)) {
      return json({ success: false, message: 'Invalid start time' }, { status: 400 });
    }
    if (endQuery !== undefined && isNaN(endQuery)) {
      return json({ success: false, message: 'Invalid end time' }, { status: 400 });
    }

    const { data } = await minecraftServer.playSessionsGet(startQuery, endQuery);

    return json({ success: true, data });
  } catch (error) {
    console.error('Error fetching playtime data:', error);
    return json({ success: false, message: 'Error fetching playtime data' }, { status: 503 });
  }
}