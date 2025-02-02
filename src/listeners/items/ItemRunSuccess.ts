import { Listener } from '@sapphire/framework';
import { Events, type RunItemPayload } from '#lib/types';
import { handleItemSuccess } from '#lib/util/functions/successHelper';

export class ItemRunSuccess extends Listener<typeof Events.ItemRunSuccess> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.ItemRunSuccess });
	}

	public run(payload: RunItemPayload) {
		handleItemSuccess(payload);
	}
}
