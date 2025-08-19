import minecraftServer from "$lib/minecraft-server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const { data: operators } = await minecraftServer.operatorsList();
	return {
		operators
	};
};