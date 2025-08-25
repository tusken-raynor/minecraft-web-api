// src/lib/cron.ts
import { CronExpressionParser } from 'cron-parser';

/**
 * Compute next UTC timestamp in seconds for a given cron string.
 * @param cronStr Standard 5-field cron string (minute-level)
 * @param fromTimestamp Optional starting point (UTC seconds). Defaults to now.
 * @returns Next run timestamp in UTC seconds
 */
export function nextRun(cronStr: string, fromTimestamp?: number): number {
    const options = {
        currentDate: fromTimestamp ? new Date(fromTimestamp * 1000) : new Date(),
        utc: true,
    };

    const interval = CronExpressionParser.parse(cronStr, options);
    return Math.floor(interval.next().getTime() / 1000);
}
