import { Item } from '#lib/structures/Item';

export class SnowGlobeItem extends Item {
	public constructor(context: Item.LoaderContext, options: Item.Options) {
		super(context, {
			...options,
			displayName: 'Snow Globe',
			collectible: true,
			description: 'A beautiful snow globe that captures the essence of winter.',
			price: -1,
			sellPrice: 50,
			icon: '❄️',
		});
	}
}
