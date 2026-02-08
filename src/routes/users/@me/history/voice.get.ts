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

		const where: Prisma.VoiceWhereInput = { userId: request.auth!.id };
		if (before) where.date = { lt: new Date(before) };

		const data = await this.container.prisma.voice.findMany({
			where,
			orderBy: { date: 'desc' },
			take: limit,
		});

		response.json({ data });
	}
}
