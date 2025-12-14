import { Listener } from '@sapphire/framework';
import { type ErrorEventPayload, Events } from '#lib/types';
import { handleEventRunError } from '#lib/util/functions/errorHelpers';

export class EventErrorListener extends Listener<typeof Events.EventError> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.EventError });
	}

	public run(error: Error, payload: ErrorEventPayload) {
		handleEventRunError(error, payload);
	}
}
