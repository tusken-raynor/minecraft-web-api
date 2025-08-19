import tasks from "./tasks";

let pulseInterval: NodeJS.Timeout | null = null;
let hasStarted = false;

export function startPulse(interval: number) {
  if (hasStarted) return;
  hasStarted = true;

  pulseInterval = setInterval(() => {
    for (const key in tasks) {
      const task = (tasks as any)[key];
      if (typeof task === "function") {
        task();
      }
    }
  }, interval);
}

export function stopPulse() {
  if (pulseInterval) {
    clearInterval(pulseInterval);
  }
  hasStarted = false;
}

export function hasPulse(): boolean {
  return hasStarted;
}