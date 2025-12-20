import { Item } from '#lib/structures/Item';
import { ItemEmojis } from '#lib/util/constants';

export class CandyCaneItem extends Item {
	public constructor(context: Item.LoaderContext, options: Item.Options) {
		super(context, {
			...options,
			displayName: 'Candy Cane',
			collectible: true,
			description: 'A sweet peppermint treat for the holidays!',
			price: -1,
			sellPrice: 20,
			icon: ItemEmojis.CandyCane,
		});
	}
}
