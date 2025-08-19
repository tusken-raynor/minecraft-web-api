import { env } from '$env/dynamic/private';
import utils from '$lib/utils';
import fs from 'fs';

export default {
  append2ServerLogs(message: string, context: string = 'Server api/INFO') {
    const logFilePath = env.SERVER_PATH + '/logs/latest.log';
    // Get UTC HH:MM:SS timestamp
    const timestamp = utils.getUTCTimestamp();
    const logMessage = `[${timestamp}] [${context}]: ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
  },
}