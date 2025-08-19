import playtime from '$lib/minecraft-server/playtime';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request, url }) => {
  const startQuery = url.searchParams.get('start') || undefined;
  const endQuery = url.searchParams.get('end') || undefined;

  try {
    const playtimeData = await playtime(startQuery, endQuery);
    return json({ success: true, data: playtimeData });
  } catch (error) {
    return json({ success: false, message: 'Error fetching playtime data' }, { status: 503 });
  }
}