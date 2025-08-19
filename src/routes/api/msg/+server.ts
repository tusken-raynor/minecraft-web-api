import type { RequestHandler } from "@sveltejs/kit";
import serverUtils from '$lib/server/utils';
import { json } from '@sveltejs/kit';
import JSON_FALLBACK from '$lib/server/json-fallback';
import minecraftServer from '$lib/minecraft-server';

export const POST: RequestHandler = async ({ request }) => {
  if (!minecraftServer.isConnected()) {
    return json({ success: false, message: 'Minecraft server not connected' }, { status: 503 });
  }

  // Handle message submission
  const body = await request.json();
  let message: string = body.message;
  if (!message) {
    return json({ success: false, message: 'Message is required' }, { status: 400 });
  }
  let username: string = body.username || 'Anonymous';

  // Escape quotes and backslashes in the message
  message = message.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
  // Escape quotes in the username
  username = username.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

  minecraftServer.tellraw('@a', { text: `<${username}> ${message}`, color: 'white' });
  // Append the message to the minecraft server logs to ensure it is visible in the console
  serverUtils.append2ServerLogs(`<${username}> ${message}`);

  return json({ success: true, message: 'Message sent successfully' });
}

export const GET = JSON_FALLBACK;
export const PUT = JSON_FALLBACK;
export const DELETE = JSON_FALLBACK;
export const PATCH = JSON_FALLBACK;
export const OPTIONS = JSON_FALLBACK;