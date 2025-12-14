import type { EventStore } from '#lib/structures/EventStore';
import type { ItemStore } from '#lib/structures/ItemStore';

declare module '@sapphire/framework' {
	interface StoreRegistryEntries {
		events: EventStore;
		items: ItemStore;
	}
}
