import type { $Enums, Prisma } from '@prisma/client';
import { Route } from '@sapphire/plugin-api';
import { Time } from '@sapphire/time-utilities';
import { authenticated, ratelimit } from '#lib/api/utils';

export class UserRoute extends Route {
	@authenticated()
	@ratelimit(Time.Second * 5, 2, true)
	public async run(request: Route.Request, response: Route.Response) {
		const limit = Math.min(Number(request.query.limit) || 50, 100);
		const before = request.query.before as string | undefined;
		const reason = request.query.reason as string | undefined;

		const where: Prisma.ExperienceHistoryWhereInput = { userId: request.auth!.id };
		if (before) where.createdAt = { lt: new Date(before) };
		if (reason) where.reason = reason as Prisma.ExperienceHistoryWhereInput['reason'];

		const experience = await this.container.prisma.experienceHistory.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		const data = experience.map(entry => ({
			id: entry.id,
			userId: entry.userId,
			amount: entry.amount,
			reason: this.getReason(entry.reason),
			levelUp: entry.levelUp,
			createdAt: entry.createdAt,
		}));

		response.json({ data });
	}

	private getReason(reason: $Enums.ExperienceReason) {
		switch (reason) {
			case 'MESSAGE':
				return 'Sent a message in chat';
			case 'VOICE':
				return 'Spent time in voice chat';
			default:
				return reason;
		}
	}
}
