export interface RconOptions {
  host: string;
  port: number;
  password: string;
  timeout?: number;
}

export default class DummyRcon {
  private responses: Map<RegExp, string> = new Map([
    [/^list$/, 'There are 2 of a max of 20 players online: PlumSquirrel, SF121'],
    [/^time query daytime$/, 'The time is 3868'],
    [/^time set (.+)$/, 'Time set to $1'],
    [/^say (.+)$/, 'Hello from the server!'],
    [/^help$/, 'Available commands: list, time query, say hello, help'],
    [/^whitelist add (.+)$/, 'Added $1 to the whitelist'],
    [/^whitelist remove (.+)$/, 'Removed $1 from the whitelist'],
    [/^whitelist list$/, 'There are 9 whitelisted player(s): PogoPenguin, RewbenSandwich, darn, TuskenRaynor, PlumSquirrel, MrPieBrain, cookiedoughyum2, KstarDarn, SF121'],
    [/^op (.+)$/, 'Made $1 a server operator'],
    [/^deop (.+)$/, 'Made $1 no longer a server operator'],
  ]);

  constructor(private options: RconOptions) {
    // Do nothing
  }

  static async connect(options?: any): Promise<DummyRcon> {
    return new this(options);
  }

  async end(): Promise<void> {
    // Do nothing
  }

  async send(command: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const entry = Array.from(this.responses.entries()).find(([regex]) => regex.test(command));
    if (entry) {
      const [regex, response] = entry;
      return command.replace(regex, response);
    }
    return `Unknown command: ${command}`;
  }
}