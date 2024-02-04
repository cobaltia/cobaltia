import { type Events, Listener, type UserError, type ContextMenuCommandDeniedPayload } from '@sapphire/framework';
import { handleChatInputOrContextMenuCommandDenied } from '#util/functions/deniedHelper';

export class ContextMenuCommandDenied extends Listener<typeof Events.ContextMenuCommandDenied> {
	public run(error: UserError, payload: ContextMenuCommandDeniedPayload) {
		return handleChatInputOrContextMenuCommandDenied(error, payload);
	}
}
