import { Route } from '@sapphire/plugin-api';
import { Time } from '@sapphire/time-utilities';
import { authenticated, ratelimit } from '#lib/api/utils';

export class UserRoute extends Route {
	@authenticated()
	@ratelimit(Time.Second * 5, 2, true)
	public async run(request: Route.Request, response: Route.Response) {
		const inventory = await this.container.prisma.inventory.findMany({
			where: { userId: request.auth!.id, quantity: { gt: 0 } },
			orderBy: { quantity: 'desc' },
		});

		const itemStore = this.container.stores.get('items');

		const data = inventory.map(entry => {
			const item = itemStore.get(entry.itemId);
			return {
				itemId: entry.itemId,
				quantity: entry.quantity,
				displayName: item?.displayName ?? entry.itemId,
				description: item?.description ?? '',
				icon: item?.icon ?? '',
				price: item?.price ?? 0,
				sellPrice: item?.sellPrice ?? 0,
			};
		});

		response.json({ data });
	}
}
