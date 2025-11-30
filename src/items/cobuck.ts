import { Item } from '#lib/structures/Item';
import { ItemEmojis } from '#lib/util/constants';

export class CobuckItem extends Item {
	public constructor(context: Item.LoaderContext, options: Item.Options) {
		super(context, {
			...options,
			displayName: 'Cobuck',
			collectible: true,
			description: 'Wait what physical cobuck money?',
			price: 1,
			sellPrice: 1,
			icon: ItemEmojis.Cobuck,
		});
	}
}
