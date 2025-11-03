import { Item } from '#lib/structures/Item';

export class CoalItem extends Item {
	public constructor(context: Item.LoaderContext, options: Item.Options) {
		super(context, {
			...options,
			displayName: 'Lump of Coal',
			collectible: true,
			description: 'A lump of coal. Not very valuable, but it has its uses.',
			price: -1,
			sellPrice: 15,
			icon: '🪨',
		});
	}
}
