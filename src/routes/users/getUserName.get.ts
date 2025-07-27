import { Route } from '@sapphire/plugin-api';
import { Time } from '@sapphire/time-utilities';

export class UserRoute extends Route {
	public async run(_request: Route.Request, response: Route.Response) {
		const { client, redis } = this.container;
		const CACHE_KEY = 'users:list';

		const cached = await redis.get(CACHE_KEY);
		if (cached) {
			response.json(JSON.parse(cached));
			return;
		}

		const usersMap = new Map<string, { id: string; username: string }>();

		await Promise.all(
			client.guilds.cache.map(async guild => {
				const members = await guild.members.fetch({ limit: 1_000 });
				for (const member of members.values()) {
					const { user } = member;
					if (!usersMap.has(user.id)) {
						usersMap.set(user.id, { id: user.id, username: user.globalName ?? user.username });
					}
				}
			}),
		);

		const users = Array.from(usersMap.values());

		await redis.set(CACHE_KEY, JSON.stringify(users), 'EX', Time.Day);

		response.json(users);
	}
}
