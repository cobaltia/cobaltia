import { Listener, type UserError } from '@sapphire/framework';
import { type ChatInputSubcommandDeniedPayload, SubcommandPluginEvents } from '@sapphire/plugin-subcommands';
import { handleChatInputOrContextMenuCommandDenied } from '#lib/util/functions/deniedHelper';

export class ChatInputSubcommandDeniedListener extends Listener<
	typeof SubcommandPluginEvents.ChatInputSubcommandDenied
> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: SubcommandPluginEvents.ChatInputSubcommandDenied,
		});
	}

	public async run(error: UserError, payload: ChatInputSubcommandDeniedPayload) {
		return handleChatInputOrContextMenuCommandDenied(error, payload);
	}
}
