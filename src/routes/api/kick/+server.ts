import { json } from '@sveltejs/kit';
import minecraftServer from '$lib/minecraft-server/index.js';
import JSON_FALLBACK from '$lib/server/json-fallback';

export async function POST({ request }) {
  if (!minecraftServer.isConnected()) {
    return json({ success: false, message: 'Minecraft server not connected' }, { status: 503 });
  }

  const body = await request.json();
  let username = body?.username;
  let reason = body?.reason;
  if (!username) {
    return json({ success: false, message: 'Username is required' }, { status: 400 });
  }

  username = username.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

  try {
    const { success, raw } = await minecraftServer.kick(username, reason);
    return json({ success, message: raw }, { status: 200 });
  } catch (error) {
    console.error('Error kicking user:', error);
    return json({ success: false, message: 'Failed to kick user from world.' }, { status: 500 });
  }
};

export const GET = JSON_FALLBACK;
export const PUT = JSON_FALLBACK;
export const DELETE = JSON_FALLBACK;
export const PATCH = JSON_FALLBACK;
export const OPTIONS = JSON_FALLBACK;