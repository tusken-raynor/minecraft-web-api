import type { RequestHandler } from "@sveltejs/kit";
import { json } from '@sveltejs/kit';
import minecraftServer from "$lib/minecraft-server";

export const POST: RequestHandler = async ({ request }) => {
  if (!minecraftServer.isConnected()) {
    return json({ success: false, message: 'Minecraft server not connected' }, { status: 503 });
  }
  const body = await request.json();
  const username = body?.username;
  if (!username) {
    return json({ success: false, message: 'Username is required' }, { status: 400 });
  }

  try {
    const response = await minecraftServer.op(username);
    const success = !!response.raw.match(/Made .+? a server operator/);
    const { data } = await minecraftServer.operatorsList();
    return json({ success, message: response.raw, data }, { status: 200 });
  } catch (error: any) {
    return json({ success: false, message: 'Failed to add operator: ' + error.message }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  if (!minecraftServer.isConnected()) {
    return json({ success: false, message: 'Failed to connect to Minecraft server' }, { status: 503 });
  }
  const body = await request.json();
  const username = body?.username;
  if (!username) {
    return json({ success: false, message: 'Username is required' }, { status: 400 });
  }

  try {
    const response = await minecraftServer.deop(username);
    const success = !!response.raw.match(/Made .+? no longer a server operator/);
    const { data } = await minecraftServer.operatorsList();
    return json({ success, message: response.raw, data }, { status: 200 });
  } catch (error: any) {
    return json({ success: false, message: 'Failed to remove operator: ' + error.message }, { status: 500 });
  }
};

export const GET: RequestHandler = async () => {
  if (!minecraftServer.isConnected()) {
    return json({ success: false, message: 'Failed to connect to Minecraft server' }, { status: 503 });
  }

  try {
    const response = await minecraftServer.operatorsList();
    return json({ success: response.success, data: response.data }, { status: response.success ? 200 : 500 });
  } catch (error: any) {
    return json({ success: false, message: 'Failed to retrieve operators: ' + error.message }, { status: 500 });
  }
};