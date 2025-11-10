import { Item } from '#lib/structures/Item';

export class BrokenCandyCaneItem extends Item {
	public constructor(context: Item.LoaderContext, options: Item.Options) {
		super(context, {
			...options,
			displayName: 'Broken Candy Cane',
			collectible: true,
			description: 'A candy cane that has seen better days. Still sweet, but a bit sad.',
			price: -1,
			sellPrice: 10,
			icon: '🍬',
		});
	}
}
