import { Listener } from '@sapphire/framework';
import { Events, type RunEventPayload } from '#lib/types';
import { handleEventSuccess } from '#lib/util/functions/successHelper';

export class EventRunSuccessListener extends Listener<typeof Events.EventRunSuccess> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.EventRunSuccess });
	}

	public run(payload: RunEventPayload) {
		handleEventSuccess(payload);
	}
}
