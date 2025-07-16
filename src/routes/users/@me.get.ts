import { HttpCodes, Route } from '@sapphire/plugin-api';
import { flattenGuild, flattenUser, type FlattenedGuild } from '#lib/api/ApiTransformers';

export class UserRoute extends Route {
	public async run(request: Route.Request, response: Route.Response) {
		const { client } = this.container;
		const user = await client.users.fetch(request.query!.id as string).catch(() => null);
		if (user === null) {
			response.error(HttpCodes.InternalServerError);
			return;
		}

		const guilds: FlattenedGuild[] = [];
		for (const guild of client.guilds.cache.values()) {
			if (guild.members.cache.has(user.id)) guilds.push(flattenGuild(guild));
		}

		response.json({ ...flattenUser(user), guilds });
	}
}
