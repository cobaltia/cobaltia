import { Route } from '@sapphire/plugin-api';

export class UserRoute extends Route {
	public run(_request: Route.Request, response: Route.Response) {
		const itemStore = this.container.stores.get('items');
		const items = itemStore.map(item => {
			return {
				id: item.id,
				name: item.name,
				description: item.description,
				collectible: item.collectible,
				price: item.price,
				sellPrice: item.sellPrice,
				icon: item.icon,
			};
		});
		response.json(items);
	}
}
