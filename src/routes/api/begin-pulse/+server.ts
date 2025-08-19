import { startPulse } from "$lib/pulse";

export async function GET() {
  // Start a 10 second pulse to process server tasks
  startPulse(10000);

  return new Response('Pulse started\n');
}

export const POST = GET;
