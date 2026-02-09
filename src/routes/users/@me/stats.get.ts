import { HttpCodes, Route } from '@sapphire/plugin-api';
import { Time } from '@sapphire/time-utilities';
import { authenticated, ratelimit } from '#lib/api/utils';

export class UserRoute extends Route {
	@authenticated()
	@ratelimit(Time.Second * 5, 2, true)
	public async run(request: Route.Request, response: Route.Response) {
		const user = await this.container.prisma.user.findUnique({
			where: { id: request.auth!.id },
		});

		if (!user) {
			response.status(HttpCodes.NotFound).json({ error: 'User not found' });
			return;
		}

		response.json({
			wallet: user.wallet.toDecimalPlaces(2).toNumber(),
			bankBalance: user.bankBalance.toDecimalPlaces(2).toNumber(),
			bankLimit: user.bankLimit.toDecimalPlaces(2).toNumber(),
			netWorth: user.wallet.add(user.bankBalance).toDecimalPlaces(2).toNumber(),
			bounty: user.bounty.toDecimalPlaces(2).toNumber(),
			experience: user.experience,
			level: user.level,
			socialCredit: user.socialCredit,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		});
	}
}
