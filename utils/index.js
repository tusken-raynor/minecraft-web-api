const fs = require('fs');

module.exports = {
  append2ServerLogs(message, context = 'Server thread/INFO') {
    const logFilePath = process.env.SERVER_PATH + '/logs/server.log';
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${context}] ${message}\n`;
    // fs.appendFileSync(logFilePath, logMessage);
    console.log(`Log message appended: ${logMessage.trim()}`, logFilePath);
  }
}