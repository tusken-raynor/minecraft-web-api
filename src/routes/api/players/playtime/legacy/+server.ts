import minecraftServer from '$lib/minecraft-server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const start = url.searchParams.get('start') || undefined;
    const end = url.searchParams.get('end') || undefined;
    const { data } = await minecraftServer.playtimeGet(start, end, true);
    return json({ success: true, data });
  } catch (error) {
    console.error('Error fetching playtime data:', error);
    return json({ success: false, message: 'Error fetching playtime data' }, { status: 503 });
  }
}