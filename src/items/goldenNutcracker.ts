import { Item } from '#lib/structures/Item';

export class GoldenNutcrakerItem extends Item {
	public constructor(context: Item.LoaderContext, options: Item.Options) {
		super(context, {
			...options,
			displayName: 'Golden Nutcracker',
			collectible: true,
			description: 'A shiny golden nutcracker, a symbol of holiday cheer and prosperity.',
			price: -1,
			sellPrice: 5_000,
			icon: '🪆',
		});
	}
}
