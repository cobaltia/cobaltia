import { Route } from '@sapphire/plugin-api';

export class UserRoute extends Route {
	public async run(_request: Route.Request, response: Route.Response) {
		const { client } = this.container;

		const users = client.users.cache.map(user => {
			return { id: user.id, username: user.globalName };
		});

		response.json(users);
	}
}
