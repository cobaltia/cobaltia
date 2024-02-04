import { Events, Listener, type UserError, type ContextMenuCommandDeniedPayload } from '@sapphire/framework';
import { handleChatInputOrContextMenuCommandDenied } from '#util/functions/deniedHelper';

export class ContextMenuCommandDenied extends Listener<typeof Events.ContextMenuCommandDenied> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.ContextMenuCommandDenied,
		});
	}

	public async run(error: UserError, payload: ContextMenuCommandDeniedPayload) {
		return handleChatInputOrContextMenuCommandDenied(error, payload);
	}
}
