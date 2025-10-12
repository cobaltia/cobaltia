import { Item } from '#lib/structures/Item';

export class CobuckItem extends Item {
	public constructor(context: Item.LoaderContext, options: Item.Options) {
		super(context, {
			...options,
			displayName: 'cobuck',
			collectible: true,
			description: 'Wait what physical cobuck money?',
			price: 1,
			sellPrice: 1,
			icon: '💵',
		});
	}
}
