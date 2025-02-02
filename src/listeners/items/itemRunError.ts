import { Listener } from '@sapphire/framework';
import { Events, type ErrorItemPayload } from '#lib/types';
import { handleItemRunError } from '#lib/util/functions/errorHelpers';

export class ItemError extends Listener<typeof Events.ItemError> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.ItemError });
	}

	public run(error: Error, payload: ErrorItemPayload) {
		handleItemRunError(error, payload);
	}
}
