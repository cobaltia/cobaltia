import { Store } from '@sapphire/framework';
import { Event } from '#structures/Event';

export class EventStore extends Store<Event, 'events'> {
	public constructor() {
		super(Event, { name: 'events' });
	}
}
