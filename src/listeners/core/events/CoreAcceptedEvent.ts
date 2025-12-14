import { Listener, Result } from '@sapphire/framework';
import { Stopwatch } from '@sapphire/stopwatch';
import { type EventPayload, Events } from '#lib/types';

export class CoreAcceptedEvent extends Listener<typeof Events.EventAccepted> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.EventAccepted });
	}

	public async run(payload: EventPayload) {
		const { event, interaction } = payload;

		const result = await Result.fromAsync(async () => {
			const stopwatch = new Stopwatch();
			await event.run!(interaction);
			const { duration } = stopwatch.stop();

			this.container.client.emit(Events.EventRunSuccess, { ...payload, duration });

			return duration;
		});

		// eslint-disable-next-line promise/prefer-await-to-callbacks
		result.inspectErr(error => this.container.client.emit(Events.EventError, error, { ...payload, duration: -1 }));
	}
}
