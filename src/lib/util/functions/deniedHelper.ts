import type { ChatInputCommandDeniedPayload, ContextMenuCommandDeniedPayload, UserError } from '@sapphire/framework';
import type { ChatInputSubcommandDeniedPayload } from '@sapphire/plugin-subcommands';

export async function handleChatInputOrContextMenuCommandDenied(
	{ context, message: content }: UserError,
	{ interaction }: ChatInputCommandDeniedPayload | ChatInputSubcommandDeniedPayload | ContextMenuCommandDeniedPayload,
) {
	// eslint-disable-next-line unicorn/new-for-builtins
	if (Reflect.get(Object(context), 'silent')) return;

	return interaction.reply({
		content,
		allowedMentions: { users: [interaction.user.id], roles: [] },
		ephemeral: true,
	});
}
