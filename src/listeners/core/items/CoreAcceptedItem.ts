import { Listener, Result } from '@sapphire/framework';
import { Events, type ItemPayload } from '#lib/types';
import { Stopwatch } from '@sapphire/stopwatch';

export class CoreAcceptedItem extends Listener<typeof Events.ItemAccepted> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.ItemAccepted });
	}

	public async run(payload: ItemPayload) {
		const { item, interaction } = payload;

		const result = await Result.fromAsync(async () => {
			const stopwatch = new Stopwatch();
			await item.run!(interaction);
			const { duration } = stopwatch.stop();

			this.container.client.emit(Events.ItemRunSuccess, { ...payload, duration });

			return duration;
		});

		// eslint-disable-next-line promise/prefer-await-to-callbacks
		result.inspectErr(error => this.container.client.emit(Events.ItemError, error, { ...payload, duration: -1 }));
	}
}
