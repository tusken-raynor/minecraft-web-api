import { hasPulse } from "$lib/pulse";
import { json } from "@sveltejs/kit";

export async function GET() {
  const hasAPulse = hasPulse();
  return json({ success: true, data: hasAPulse, message: hasAPulse ? "Pulse started" : "No pulse running" }, { status: 200 });
}
