import { Listener } from '@sapphire/framework';
import { type EventPayload, Events } from '#lib/types';
import { handleItemOrEventDenied } from '#lib/util/functions/deniedHelper';

export class EventRunDeniedListener extends Listener<typeof Events.EventDenied> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.EventDenied });
	}

	public run(error: string, payload: EventPayload) {
		handleItemOrEventDenied(error, payload);
	}
}
