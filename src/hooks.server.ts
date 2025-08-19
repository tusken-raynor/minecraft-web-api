import type { Handle } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_ENDPOINTS, AUTH_TOKEN, WHITELISTED_IPS } from '$lib/server/access.json';
import { dev } from '$app/environment';
import minecraftServer from '$lib/minecraft-server';

export const handle: Handle = async ({ event, resolve }) => {
  const { url, request } = event;
  let isAuthorized = false;
  let isAuthenticated = dev;

  let endpointPath = url.pathname;
  // Some endpoints are public when using GET requests
  if (request.method === 'GET') {
    // Make sure the endpoint path starts with a slash and ends with a slash
    if (!endpointPath.startsWith('/')) {
      endpointPath = `/${endpointPath}`;
    }
    if (!endpointPath.endsWith('/')) {
      endpointPath += '/';
    }
    // If the endpoint is public, skip security checks
    if (PUBLIC_ENDPOINTS.includes(endpointPath)) {
      isAuthorized = true;
    }
  }

  const isAPI = endpointPath.startsWith('/api/');

  const clientIPRaw = 
    event.getClientAddress?.() ||
    request.headers.get('x-forwarded-for') || 
    request.headers.get('x-real-ip') || 
    request.headers.get('cf-connecting-ip') || 
    request.headers.get('x-client-ip') || 
    (request as any).socket?.remoteAddress || '';

  // Normalize for cases like "::ffff:127.0.0.1"
  const clientIP = clientIPRaw.replace('::ffff:', '');

  isAuthenticated = isAuthenticated || WHITELISTED_IPS.includes(clientIP);

  // Attempt to authenticate the request using the AUTH_TOKEN
  if (!isAuthenticated) {
    const authHeader = request.headers.get('x-auth') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    isAuthenticated = token === AUTH_TOKEN;
  }

  isAuthorized = isAuthorized || isAuthenticated;

  if (isAuthorized) {
    // Now that we are authorized, connect to the Minecraft server
    try {
      await minecraftServer.connect();
    } catch (error) {
      console.error('Failed to initialize RCON:', error);
      return isAPI
        ? json({ success: false, message: 'Minecraft server connection failed' }, { status: 503 })
        : new Response('Minecraft server connection failed', { status: 503 });
    }

    const headers = new Headers();
    if (isAuthenticated) {
      allowCrossOriginActivity(headers);
    }

    if (request.method === 'OPTIONS') {
      // Handle preflight requests
      return new Response(null, { status: 204, headers });
    }

    const response = await resolve(event);
    // Merge headers from the response with our custom headers
    for (const [key, value] of response.headers.entries()) {
      if (!headers.has(key)) {
        headers.set(key, value);
      }
    }
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  if (isAPI) {
    // If the request is to an API endpoint and not authorized, return a 403 Forbidden json response
    return json({ success: false, message: 'Forbidden: Unauthorized access' }, { status: 403 });
  }

  return new Response('Forbidden: Unauthorized access', { status: 403 });
};

function allowCrossOriginActivity(headers: Headers) {
  // Set a Access-Control-Allow-Origin header to allow cross-origin requests
  headers.set('Access-Control-Allow-Origin', '*');
  // Set a Access-Control-Allow-Methods header to allow all methods
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // Set a Access-Control-Allow-Headers header to allow all headers
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth');
}
