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

		const where: Prisma.MoneyHistoryWhereInput = { userId: request.auth!.id };
		if (before) where.createdAt = { lt: new Date(before) };
		if (reason) where.reason = reason as Prisma.MoneyHistoryWhereInput['reason'];

		const money = await this.container.prisma.moneyHistory.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		const data = money.map(entry => ({
			id: entry.id,
			userId: entry.userId,
			amount: entry.amount.toDecimalPlaces(2).toNumber(),
			reason: this.getReason(entry.reason, entry.earned),
			earned: entry.earned,
			createdAt: entry.createdAt,
		}));

		response.json({ data });
	}

	private getReason(reason: $Enums.MoneyReason, earned: boolean) {
		switch (reason) {
			case 'BOUNTY_CLAIM':
				return 'Earned from claiming a bounty';
			case 'DAILY':
				return 'Earned from daily reward';
			case 'DEATH':
				return 'Lost from dying';
			case 'GAMBLING':
				return earned ? 'Earned from gambling' : 'Lost from gambling';
			case 'ROB':
				return 'Stolen from another user';
			case 'STORE':
				return earned ? 'Earned from selling an item in the store' : 'Spent on buying an item from the store';
			case 'TAX':
				return 'Paid as tax';
			case 'WORK':
				return 'Earned from work';
			case 'VOICE':
				return 'Earned from spending time in voice chat';
			default:
				return reason;
		}
	}
}
