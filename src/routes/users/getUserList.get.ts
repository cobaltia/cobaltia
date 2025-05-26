import { Route } from '@sapphire/plugin-api';
import { flattenUser } from '#lib/api/ApiTransformers';

export class UserRoute extends Route {
	public async run(request: Route.Request, response: Route.Response) {
		const { client } = this.container;
		const { users } = request.query;

		if (!users || typeof users !== 'string' || users.trim() === '') {
			response.status(400).json({ error: 'Missing or invalid query' });
			return;
		}

		const userIds = (users as string).split(',');
		const rawUsers = await Promise.all(userIds.map(async user => client.users.fetch(user)));
		const userList = rawUsers.map(raw => flattenUser(raw));

		response.json(userList);
	}
}
