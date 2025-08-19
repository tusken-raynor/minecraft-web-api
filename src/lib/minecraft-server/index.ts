import { env } from '$env/dynamic/private';
import MinecraftServer from './MinecraftServer';

const minecraftServer = new MinecraftServer({
  host: '127.0.0.1',
  port: 25575,
  password: env.RCON_PASSWORD
});

export default minecraftServer;