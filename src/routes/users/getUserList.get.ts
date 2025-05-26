import { Route } from '@sapphire/plugin-api';
import { type FlattenedUser, flattenUser } from '#lib/api/ApiTransformers';

export class UserRoute extends Route {
	public async run(request: Route.Request, response: Route.Response) {
		const { users } = request.query;
		const { client } = this.container;
		const userList: FlattenedUser[] = [];
		for (const user of (users as string).split(',')) {
			const raw = await client.users.fetch(user);
			userList.push(flattenUser(raw));
		}

		response.json(userList);
	}
}
