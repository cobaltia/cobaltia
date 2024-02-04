import { Listener, type ContextMenuCommandErrorPayload, type Events } from '@sapphire/framework';
import { handleChatInputOrContextMenuCommandError } from '#util/functions/errorHelpers';

export class ContextMenuCommandErrorListener extends Listener<typeof Events.ContextMenuCommandError> {
	public run(error: Error, payload: ContextMenuCommandErrorPayload) {
		return handleChatInputOrContextMenuCommandError(error, payload);
	}
}
