import { Rcon } from 'rcon-client';
import type { MinecraftCommandResponse, MinecraftServerOperator, MinecraftServerOptions, MinecraftTellrawText, MinecraftTimeOfDay } from './types';
import { dev } from '$app/environment';
import RconDummy from './rcon-dummy';
import { env } from '$env/dynamic/private';
import fs from "fs";
import playtime from './playtime';

export default class MinecraftServer {
  private rcon!: Rcon | RconDummy;
  private connected: boolean = false;

  constructor(private options: MinecraftServerOptions) {}

  async connect(): Promise<void> {
    if (!this.connected) {
      if (!dev) {
        this.rcon = await Rcon.connect({
          host: this.options.host,
          port: this.options.port,
          password: this.options.password,
        });
      } else {
        this.rcon = await RconDummy.connect();
      }
      this.connected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected && this.rcon) {
      await this.rcon.end();
      this.connected = false;
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  async runCommand(command: string): Promise<MinecraftCommandResponse> {
    await this.connect();
    try {
      const raw = await this.rcon.send(command);
      return {
        command,
        success: true,
        data: raw,
        raw,
      };
    } catch (error) {
      return {
        command,
        success: false,
        data: error,
        raw: String(error),
      };
    }
  }

  async listPlayers(): Promise<MinecraftCommandResponse<{ online: number; max: number; players: string[]; }>> {
    const response = await this.runCommand('list');
    const messageParts = response.data.match(/(\d+) of a max of (\d+) players online: (.+)/);
    const online = messageParts ? parseInt(messageParts[1], 10) : 0;
    const max = messageParts ? parseInt(messageParts[2], 10) : 0;
    const players = messageParts ? messageParts[3].split(', ') : [];
    response.data = {
      online,
      max,
      players,
    };
    return response;
  }

  async say(message: string): Promise<MinecraftCommandResponse> {
    return await this.runCommand(`say ${message}`);
  }

  async kick(player: string, reason?: string): Promise<MinecraftCommandResponse> {
    return await this.runCommand(`kick ${player}${reason ? ' ' + reason : ''}`);
  }

  async ban(player: string, reason?: string): Promise<MinecraftCommandResponse> {
    return await this.runCommand(`ban ${player}${reason ? ' ' + reason : ''}`);
  }

  async op(player: string): Promise<MinecraftCommandResponse> {
    return await this.runCommand(`op ${player}`);
  }

  async deop(player: string): Promise<MinecraftCommandResponse> {
    return await this.runCommand(`deop ${player}`);
  }

  async operatorsList(): Promise<MinecraftCommandResponse<Array<MinecraftServerOperator>>> {
    // Return a list of the operators by looking at the ops.json file
    const filePath = `${env.SERVER_PATH}/ops.json`;
    if (!fs.existsSync(filePath)) {
      return {
        command: 'N/A',
        success: false,
        data: [],
        raw: 'No operators found. Who is in charge?'
      }
    }
    try {
      const json = fs.readFileSync(filePath, 'utf8');
      const operators = JSON.parse(json);
      return {
        command: 'N/A',
        success: true,
        data: operators,
        raw: json
      };
    } catch (error: any) {
      return {
        command: 'N/A',
        success: false,
        data: [],
        raw: 'Failed to read operators: ' + error.message
      }
    }
  }

  async stop(): Promise<MinecraftCommandResponse> {
    return await this.runCommand('stop');
  }

  async tellraw(target: string, payload: MinecraftTellrawText | string): Promise<MinecraftCommandResponse> {
    return await this.runCommand(`tellraw ${target} ${JSON.stringify(payload)}`);
  }

  async whitelistList(): Promise<MinecraftCommandResponse<Array<{ name: string; uuid?: string; }>>> {
    const filePath = `${env.SERVER_PATH}/whitelist.json`;
    if (!fs.existsSync(filePath)) {
      console.warn('No whitelist file found. Fallback to RCON.');
      const response = await this.runCommand('whitelist list');
      if (response.success) {
        const messageParts = response.raw.match(/There are (\d+) whitelisted player\(s\): (.+)/);
        if (messageParts) {
          const players = messageParts[2].split(', ').map(name => ({ name }));
          return {
            command: 'whitelist list',
            success: true,
            data: players,
            raw: response.raw,
          };
        }
      }
      return response;
    }
    const json = fs.readFileSync(filePath, 'utf8');
    const whitelisted = JSON.parse(json);
    return {
      success: true,
      command: 'whitelist list',
      data: whitelisted,
      raw: json
    };
  }

  async whitelistAdd(player: string): Promise<MinecraftCommandResponse> {
    return await this.runCommand(`whitelist add ${player}`);
  }

  async whitelistRemove(player: string): Promise<MinecraftCommandResponse> {
    return await this.runCommand(`whitelist remove ${player}`);
  }

  async timeAdd(time: number): Promise<MinecraftCommandResponse> {
    return await this.runCommand(`time add ${time}`);
  }

  async timeGet(): Promise<MinecraftCommandResponse> {
    return await this.runCommand('time query daytime');
  }

  async timeSet(time: number | MinecraftTimeOfDay): Promise<MinecraftCommandResponse> {
    return await this.runCommand(`time set ${time}`);
  }

  async playtimeGet(startTime?: string, endTime?: string): Promise<MinecraftCommandResponse<Array<{ user: string; playtime: string; totalSeconds: number; isOnline: boolean; }>>> {
    try {
      const playtimeData = await playtime(startTime, endTime);
      return {
        command: 'N/A',
        success: true,
        data: playtimeData,
        raw: ''
      };
    } catch (error) {
      console.error('Error fetching playtime data:', error);
      return {
        command: 'N/A',
        success: false,
        data: [],
        raw: String(error)
      };
    }
  }

  // Add more operator commands as needed...
}