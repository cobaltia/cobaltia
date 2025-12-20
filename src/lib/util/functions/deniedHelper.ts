import type { ChatInputCommandDeniedPayload, ContextMenuCommandDeniedPayload, UserError } from '@sapphire/framework';
import type { ChatInputSubcommandDeniedPayload } from '@sapphire/plugin-subcommands';
import type { EventPayload, ItemPayload } from '#lib/types';

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

export async function handleItemOrEventDenied(error: string, { interaction }: EventPayload | ItemPayload) {
	return interaction.reply({
		content: error,
		allowedMentions: { users: [interaction.user.id], roles: [] },
		ephemeral: true,
	});
}
