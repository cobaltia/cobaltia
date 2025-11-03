import { Item } from '#lib/structures/Item';

export class SantaHatItem extends Item {
	public constructor(context: Item.LoaderContext, options: Item.Options) {
		super(context, {
			...options,
			displayName: 'Santa Hat',
			collectible: true,
			description: 'Wear this to feel the Christmas spirit!',
			price: -1,
			sellPrice: 50,
			icon: '🎅',
		});
	}
}
