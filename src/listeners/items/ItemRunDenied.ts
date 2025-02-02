import { Listener } from '@sapphire/framework';
import { Events, type ItemPayload } from '#lib/types/discord';
import { handleItemDenied } from '#lib/util/functions/deniedHelper';

export class ItemRunDenied extends Listener<typeof Events.ItemDenied> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.ItemDenied });
	}

	public run(error: string, payload: ItemPayload) {
		handleItemDenied(error, payload);
	}
}
