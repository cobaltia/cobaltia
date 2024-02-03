import { type ChatInputCommandDeniedPayload, type Events, Listener, type UserError } from '@sapphire/framework';
import { handleChatInputOrContextMenuCommandDenied } from '#lib/util/functions/deniedHelper';

export class ChatInputCommandDeniedListener extends Listener<typeof Events.ChatInputCommandDenied> {
	public async run(error: UserError, payload: ChatInputCommandDeniedPayload) {
		return handleChatInputOrContextMenuCommandDenied(error, payload);
	}
}
