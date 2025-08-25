export type CommandPayload = {
  success: true;
  command: string;
} | {
  success: false;
  message: string;
};

export default {
  kick(payload) {
    // Validate the payload
    const invalidPayload = 
      (!payload || typeof payload !== 'object') || 
      (!payload.hasOwnProperty('username') || (typeof payload.username !== 'string' || payload.username.trim() === ''));
    if (invalidPayload) {
      return { success: false, message: 'Invalid payload' };
    }

    const username = payload.username.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
    const reason = payload.reason ? payload.reason.replace(/"/g, '\\"').replace(/\\/g, '\\\\') : '';

    const command = `kick ${username} ${reason}`.trim();

    return { success: true, command };
  },
  tell(payload) {
    // Validate the payload
    const invalidPayload =
      (!payload || typeof payload !== 'object') || 
      (!payload.hasOwnProperty('username') || (typeof payload.username !== 'string' || payload.username.trim() === '')) ||
      (!payload.hasOwnProperty('message') || (typeof payload.message !== 'string' || payload.message.trim() === ''));
    if (invalidPayload) {
      return { success: false, message: 'Invalid payload' };
    }

    const username = payload.username.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
    const message = payload.message.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

    const command = `tell ${username} ${message}`.trim();

    return { success: true, command };
  }
} as Record<string, (payload: any) => CommandPayload>;