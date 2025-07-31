const fs = require('fs');

module.exports = {
  append2ServerLogs(message, context = 'Server api/INFO') {
    const logFilePath = process.env.SERVER_PATH + '/logs/latest.log';
    // Get UTC HH:MM:SS timestamp
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    const timestamp = `${hours}:${minutes}:${seconds}`;
    const logMessage = `[${timestamp}] [${context}]: ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
  },
  getUTCTimestamp() {
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`; // HH:MM:SS format
  }
}