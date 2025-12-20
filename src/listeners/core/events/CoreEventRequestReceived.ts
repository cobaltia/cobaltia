import { Listener, Result } from '@sapphire/framework';
import { Events } from '#lib/types';

export class CoreEventRequestReceived extends Listener<typeof Events.EventRequestReceived> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.EventRequestReceived });
	}

	public async run(eventName: string, interaction: any) {
		const { client, stores } = this.container;
		const eventStore = stores.get('events');
		const event = eventStore.get(eventName);

		if (!event) {
			client.emit(Events.UnknownEvent, { interaction, context: { eventName } });
			return;
		}

		let enabled = false;
		const result = await Result.fromAsync(async () =>
			this.container.prisma.event.findFirst({ where: { name: event.name } }),
		);
		if (result.isErr()) enabled = false;

		const eventData = result.unwrap();
		enabled = eventData ? eventData.enabled : false;

		if (!enabled) {
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
