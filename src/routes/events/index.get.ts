import { Route } from '@sapphire/plugin-api';
import { authenticated } from '#lib/api/utils';

export class UserRoute extends Route {
	@authenticated()
	public async run(request: Route.Request, response: Route.Response) {
		const limit = Math.min(Number(request.query.limit) || 50, 100);
		const before = request.query.before as string | undefined;
		const guildId = request.query.guildId as string | undefined;
		const userId = request.query.userId as string | undefined;

		const where: Record<string, unknown> = {};
		if (before) where.createdAt = { lt: new Date(before) };
		if (guildId) where.guildId = guildId;
		if (userId) where.userId = userId;

		const events = await this.container.prisma.auditLog.findMany({
			where: Object.keys(where).length > 0 ? where : undefined,
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		response.json({ data: events });
	}
}
