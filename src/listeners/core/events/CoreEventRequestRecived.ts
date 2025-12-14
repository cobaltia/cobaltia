import { Listener } from '@sapphire/framework';
import { Events } from '#lib/types';

export class CoreEventRequestRecived extends Listener<typeof Events.EventRequestReceived> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.EventRequestReceived });
	}

	public run(eventName: string, interaction: any) {
		const { client, stores } = this.container;
		const eventStore = stores.get('events');
		const event = eventStore.get(eventName);

		if (!event) {
			client.emit(Events.UnkonwnEvent, { interaction, context: { eventName } });
			return;
		}

		if (!event.enabled) {
			client.emit(Events.EventDenied, 'This event is currently not enabled', {
				event,
				interaction,
				context: { eventName },
			});
			return;
		}

		if (typeof event.run !== 'function') {
			client.emit(Events.EventDenied, 'This event cannot be run', {
				event,
				interaction,
				context: { eventName },
			});
			return;
		}

		client.emit(Events.EventAccepted, { event, interaction, context: { eventName } });
	}
}
