import { getTaskContext } from "./lib";
import tasks from "./tasks";

let pulseInterval: NodeJS.Timeout | null = null;
let hasStarted = false;

export function startPulse(interval: number) {
  if (hasStarted) return;
  hasStarted = true;

  pulseInterval = setInterval(async () => {
    const taskContext = await getTaskContext();
    for (const key in tasks) {
      const task: Function = (tasks as any)[key];
      if (typeof task === "function") {
        task.apply(taskContext);
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