import type { MySQLSchedulesRecord } from "$lib/db";
import { derived, writable, type Readable } from "svelte/store";

export const schedules = writable<MySQLSchedulesRecord[]>([]);

type ToastContent = { title?: string; message: string; };
export const toastContent = writable<ToastContent | null>(null);
type ToastStatus = "success" | "warning" | "error" | "info";
export const toastStatus = writable<ToastStatus>("info");
const dfltToastTime = 3000;
export const toastTime = writable<number>(dfltToastTime);

export function showToast(content: ToastContent | null, status: ToastStatus = "info", duration: number = dfltToastTime) {
  toastContent.set(content);
  toastStatus.set(status);
  toastTime.set(duration);
}
export function clearToast() {
  toastContent.set(null);
  toastStatus.set("info");
  toastTime.set(dfltToastTime);
}