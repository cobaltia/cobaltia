import { type ChatInputCommandErrorPayload, type Events, Listener } from '@sapphire/framework';
import { handleChatInputOrContextMenuCommandError } from '#util/functions/errorHelpers';

export class ChatInputCommandErrorListener extends Listener<typeof Events.ChatInputCommandError> {
	public run(error: Error, payload: ChatInputCommandErrorPayload) {
		return handleChatInputOrContextMenuCommandError(error, payload);
	}
}
