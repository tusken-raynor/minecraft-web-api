import minecraftServer from "$lib/minecraft-server";
import type { MinecraftListDetails } from "$lib/minecraft-server/types";

type TaskContext = {
  listDetails: MinecraftListDetails;
};

export function defineTasks<T extends Record<string, (this: TaskContext) => any>>(tasks: T): T {
  return tasks;
}

export async function getTaskContext(): Promise<TaskContext> {
  const { data: listDetails } = await minecraftServer.listPlayers();
  return { listDetails };
}

export function parseLogLine(line: string) {
  // Example patterns, adjust as needed for your log format
  const playerMessage = /\[(\d+:\d+:\d+)\] \[.*\]: <(\w+)> (.+)/;
  const playerJoinLeave = /\[(\d+:\d+:\d+)\] \[.+\]: (\w+) (joined|left) the game/;
  const playerDeath = /\[(\d+:\d+:\d+)\] \[.+\]: (\w+) ((was|died|fell|blew up|tried|was slain|was shot|was killed|was burnt|was pricked|was squashed|was impaled|was pummeled|was stung|was poked|was blown up|was slain|was killed|was shot|was fireballed|was squashed|was impaled|was pummeled|was stung|was poked|was blown up|died).+)/;

  let timestamp = null;
  let output = '';

  if (playerMessage.test(line)) {
    const [, time, player, message] = line.match(playerMessage)!;
    timestamp = time;
    output = `Message from ${player}: ${message}`;
  } else if (playerJoinLeave.test(line)) {
    const [, time, player, action] = line.match(playerJoinLeave)!;
    timestamp = time;
    output = `${player} ${action} the game`;
  } else if (playerDeath.test(line)) {
    const [, time, player, desc] = line.match(playerDeath)!;
    timestamp = time;
    output = `${player} ${desc}`;
  }

  return [timestamp, output];
}

export function shouldDisableChunkLoaders(players: string[]) {
  const chunkers = ['1nkDrinker', 'ChubbyPolarBears', 'darkangels1245'];
  // If the there are any players online who aren't chunk loaders, disable 
  // the loaders so that they don't cause lag
  return players.some(player => !chunkers.includes(player));
}