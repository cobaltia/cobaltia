import { Route } from '@sapphire/plugin-api';
import { authenticated } from '#lib/api/utils';

export class UserRoute extends Route {
	@authenticated()
	public async run(request: Route.Request, response: Route.Response) {
		const limit = Math.min(Number(request.query.limit) || 50, 100);
		const before = request.query.before as string | undefined;

		const events = await this.container.prisma.auditLog.findMany({
			where: before ? { createdAt: { lt: new Date(before) } } : undefined,
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		response.json({ data: events });
	}
}
