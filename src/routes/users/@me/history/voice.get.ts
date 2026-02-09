import type { Prisma } from '@prisma/client';
import { Route } from '@sapphire/plugin-api';
import { DurationFormatter, Time } from '@sapphire/time-utilities';
import { authenticated, ratelimit } from '#lib/api/utils';

export class UserRoute extends Route {
	@authenticated()
	@ratelimit(Time.Second * 5, 2, true)
	public async run(request: Route.Request, response: Route.Response) {
		const limit = Math.min(Number(request.query.limit) || 50, 100);
		const before = request.query.before as string | undefined;

		const where: Prisma.VoiceWhereInput = { userId: request.auth!.id };
		if (before) where.date = { lt: new Date(before) };

		const voice = await this.container.prisma.voice.findMany({
			where,
			orderBy: { date: 'desc' },
			take: limit,
		});

		const data = voice.map(entry => ({
			id: entry.id,
			userId: entry.userId,
			duration: new DurationFormatter().format(Number(entry.duration)),
			earned: entry.earned.toDecimalPlaces(2).toNumber(),
			date: entry.date,
		}));

		response.json({ data });
	}
}
