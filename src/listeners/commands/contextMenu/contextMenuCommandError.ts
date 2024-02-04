import { Listener, type ContextMenuCommandErrorPayload, Events } from '@sapphire/framework';
import { handleChatInputOrContextMenuCommandError } from '#util/functions/errorHelpers';

export class ContextMenuCommandErrorListener extends Listener<typeof Events.ContextMenuCommandError> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.ContextMenuCommandError,
		});
	}

	public async run(error: Error, payload: ContextMenuCommandErrorPayload) {
		console.log('ContextMenuCommandError');
		return handleChatInputOrContextMenuCommandError(error, payload);
	}
}
