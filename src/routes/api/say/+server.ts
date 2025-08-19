import { json } from '@sveltejs/kit';
import minecraftServer from '$lib/minecraft-server/index.js';
import JSON_FALLBACK from '$lib/server/json-fallback';

export async function POST({ request }) {
  if (!minecraftServer.isConnected()) {
    return json({ success: false, message: 'Minecraft server not connected' }, { status: 503 });
  }

  const body = await request.json();
  const message = body?.message;

  if (!message) {
    return json({ success: false, message: 'Message is required' }, { status: 400 });
  }

  minecraftServer.say(message);

  return json({ success: true, message: 'Message sent successfully' });
}

export const GET = JSON_FALLBACK;
export const PUT = JSON_FALLBACK;
export const DELETE = JSON_FALLBACK;
export const PATCH = JSON_FALLBACK;
export const OPTIONS = JSON_FALLBACK;