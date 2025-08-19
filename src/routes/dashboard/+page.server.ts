import minecraftServer from "$lib/minecraft-server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const { data: { players } } = await minecraftServer.listPlayers();
  const { data: playtime } = await minecraftServer.playtimeGet();
	return {
		onlineUsers: players,
		playtime
	};
};