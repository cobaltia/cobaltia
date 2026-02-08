import type { Prisma } from '@prisma/client';
import { Route } from '@sapphire/plugin-api';
import { Time } from '@sapphire/time-utilities';
import { authenticated, ratelimit } from '#lib/api/utils';

export class UserRoute extends Route {
	@authenticated()
	@ratelimit(Time.Second * 5, 2, true)
	public async run(request: Route.Request, response: Route.Response) {
		const limit = Math.min(Number(request.query.limit) || 50, 100);
		const before = request.query.before as string | undefined;
		const command = request.query.command as string | undefined;

		const where: Prisma.CommandHistoryWhereInput = { userId: request.auth!.id };
		if (before) where.createdAt = { lt: new Date(before) };
		if (command) where.command = command;

		const data = await this.container.prisma.commandHistory.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		response.json({ data });
	}
}
