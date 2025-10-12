import { Store } from '@sapphire/framework';
import { Item } from '#structures/Item';

export class ItemStore extends Store<Item, 'items'> {
	public constructor() {
		super(Item, { name: 'items' });
	}
}
