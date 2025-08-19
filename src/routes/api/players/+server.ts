import minecraftServer from '$lib/minecraft-server';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';


export const GET: RequestHandler = async ({ request }) => {
  if (!minecraftServer.isConnected()) {
    return new Response(JSON.stringify({ success: false, message: 'Minecraft server not connected' }), { status: 503 });
  }
  const response = await minecraftServer.listPlayers();
  return json({ success: true, data: response.data });
}