import { Route } from '@sapphire/plugin-api';

export class UserRoute extends Route {
	public run(_request: Route.Request, response: Route.Response) {
		const status = this.container.client.isReady();
		if (status) {
			response.status(200).json({ status: 'ok' });
		} else {
			response.status(503).json({ status: 'unavailable' });
		}
	}
}
