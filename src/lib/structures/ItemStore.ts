import { AliasStore } from '@sapphire/framework';
import { Item } from '#structures/Item';

export class ItemStore extends AliasStore<Item, 'items'> {
	public constructor() {
		super(Item, { name: 'items' });
	}
}
