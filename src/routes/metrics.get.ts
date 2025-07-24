import { type MimeType, Route } from '@sapphire/plugin-api';
import { register } from 'prom-client';

export class UserRoute extends Route {
	public async run(_request: Route.Request, response: Route.Response) {
		try {
			const prismaMetrics = await this.container.prisma.$metrics.prometheus();
			const metrics = await register.metrics();
			response
				.setContentType(register.contentType as MimeType)
				.status(200)
				.respond(prismaMetrics + metrics);
		} catch (error) {
			this.container.logger.error(error);
			response.status(500).respond({ error: 'An error occurred' });
		}
	}
}
