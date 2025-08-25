import { json } from '@sveltejs/kit';
import minecraftServer from '$lib/minecraft-server';

export const GET = async () => {
  try {
    const response = await minecraftServer.whitelistList();
    return json({ success: true, data: response.data }, { status: 200 });
  } catch (error: any) {
    return json({ success: false, message: 'Failed to read whitelist: ' + error.message }, { status: 500 });
  }
};

export const POST = async ({ request }) => {
  if (!minecraftServer.isConnected()) {
    return json({ success: false, message: 'Minecraft server not connected' }, { status: 503 });
  }

  const body = await request.json();
  let username = body?.username;
  if (!username) {
    return json({ success: false, message: 'Username is required' }, { status: 400 });
  }

  username = username.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

  try {
    const response = await minecraftServer.whitelistAdd(username);
    const success = !!response.raw.match(/Added .+? to the whitelist/);
    const { data } = await minecraftServer.whitelistList();
    return json({ success, message: response.raw, data }, { status: 200 });
  } catch (error) {
    console.error('Error adding to whitelist:', error);
    return json({ success: false, message: 'Failed to add player to whitelist: ' + (error as Error).message }, { status: 500 });
  }
};

export const DELETE = async ({ request }) => {
  if (!minecraftServer.isConnected()) {
    return json({ success: false, message: 'Minecraft server not connected' }, { status: 503 });
  }

  const body = await request.json();
  let username = body?.username;
  if (!username) {
    return json({ success: false, message: 'Username is required' }, { status: 400 });
  }

  username = username.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

  try {
    const response = await minecraftServer.whitelistRemove(username);
    const { data } = await minecraftServer.whitelistList();
    const success = !!response.raw.match(/Removed .+? from the whitelist/);
    return json({ success, message: response.raw, data }, { status: 200 });
  } catch (error) {
    console.error('Error removing from whitelist:', error);
    return json({ success: false, message: 'Failed to remove player from whitelist: ' + (error as Error).message }, { status: 500 });
  }
};
