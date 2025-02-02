import type { ItemStore } from '#lib/structures/ItemStore';

declare module '@sapphire/framework' {
	interface StoreRegistryEntries {
		items: ItemStore;
	}
}
