/* eslint-disable unicorn/new-for-builtins */
import { isMessageInstance } from '@sapphire/discord.js-utilities';
import {
	type Command,
	UserError,
	type ChatInputCommandErrorPayload,
	type ContextMenuCommandErrorPayload,
	container,
	Events,
	type ChatInputCommand,
} from '@sapphire/framework';
import type { ChatInputSubcommandErrorPayload, Subcommand } from '@sapphire/plugin-subcommands';
import {
	codeBlock,
	EmbedBuilder,
	type APIMessage,
	type Message,
	bold,
	hyperlink,
	hideLinkEmbed,
	type ChatInputCommandInteraction,
	type ContextMenuCommandInteraction,
	MessageFlags,
} from 'discord.js';
import type { ErrorEventPayload, ErrorItemPayload } from '#lib/types';
import { OWNERS } from '#root/config';
import { Colors } from '#util/constants';

const unknownErrorMessage =
	'An error occurred that I was not able to identify. Please try again. If error persists, please contact Juan.';

export async function handleChatInputOrContextMenuCommandError(
	error: Error,
	{
		command,
		interaction,
	}: ChatInputCommandErrorPayload | ChatInputSubcommandErrorPayload | ContextMenuCommandErrorPayload,
) {
	if (error instanceof UserError) return userError(interaction, error);

	const { client, logger } = container;

	if (error.name === 'AbortError' || error.message === 'Internal Server Error') {
		return alert(interaction, 'I had a small network hiccup. Please try again.');
	}

	await sendErrorChannel(interaction, command, error);

	container.analytics.recordCommand({
		command: interaction.commandName,
		userId: interaction.user.id,
		guildId: interaction.guildId ?? 'none',
		channelId: interaction.channelId,
		success: false,
	});

	logger.fatal(`[COMMAND] ${command.location.full}\n${error.stack ?? error.message}`);
	try {
		await alert(interaction, generateUnexpectedErrorMessage(interaction, error));
	} catch (error) {
		client.emit(Events.Error, error as Error);
	}

	return undefined;
}

function generateUnexpectedErrorMessage(
	interaction: ChatInputCommand.Interaction | ChatInputCommandInteraction | ContextMenuCommandInteraction,
	error: Error,
) {
	if (OWNERS.includes(interaction.user.id)) return codeBlock('js', error.stack!);
	return `I found an unexpected error, please report the steps you have taken to Juan.`;
}

export async function userError(
	interaction: ChatInputCommand.Interaction | ChatInputCommandInteraction | ContextMenuCommandInteraction,
	error: UserError,
) {
	if (Reflect.get(Object(error.context), 'silent')) return;

	return alert(interaction, error.message || unknownErrorMessage);
}

async function alert(
	interaction: ChatInputCommand.Interaction | ChatInputCommandInteraction | ContextMenuCommandInteraction,
	content: string,
) {
	if (interaction.replied || interaction.deferred) {
		return interaction.editReply({ content, allowedMentions: { users: [interaction.user.id], roles: [] } });
	}

	return interaction.reply({
		content,
		allowedMentions: { users: [interaction.user.id], roles: [] },
		flags: MessageFlags.Ephemeral,
	});
}

async function sendErrorChannel(
	interaction: ChatInputCommand.Interaction | ChatInputCommandInteraction | ContextMenuCommandInteraction,
	command: Command | Subcommand,
	error: Error,
) {
	const webhook = container.webhookError;
	if (!webhook) return;

	const interactionReply = await interaction.fetchReply();

	const links = [
		getLinkLine(interactionReply),
		getCommandLine(command),
		getOptionsLine(interaction.options),
		getErrorLine(error),
	];

	const embed = new EmbedBuilder().setDescription(links.join('\n')).setColor(Colors.Red).setTimestamp();

	try {
		await webhook.send({ embeds: [embed] });
	} catch (error) {
		container.client.emit(Events.Error, error as Error);
	}
}

export function getErrorLine(error: Error) {
	if (error instanceof Error) return `**Error**: ${codeBlock('js', error.stack ?? error.message)}`;
	return `**Error**: ${codeBlock('js', error)}`;
}

function getCommandLine(command: Command | Subcommand) {
	return `**Command**: ${command.location.full}`;
}

function getOptionsLine(options: ChatInputCommand.Interaction['options'] | ContextMenuCommandInteraction['options']) {
	if (options.data.length === 0) return '**Options**: None';

	const mappedOptions = [];
	for (const option of options.data) {
		mappedOptions.push(`**${option.name}**: ${option.value}`);
	}

	if (mappedOptions.length === 0) return '**Options**: None';

	return `**Options**: ${mappedOptions.join(', ')}`;
}

export function getLinkLine(message: APIMessage | Message) {
	if (isMessageInstance(message)) {
		return bold(hyperlink('Jump to message', hideLinkEmbed(message.url)));
	}
}

export async function handleItemRunError(error: Error, payload: ErrorItemPayload) {
	const { client, logger } = container;
	const { interaction, item } = payload;

	if (error instanceof UserError) return userError(interaction, error);

	if (error.name === 'AbortError' || error.message === 'Internal Server Error') {
		return alert(interaction, 'I had a small network hiccup. Please try again.');
	}

	logger.fatal(`[ITEM] ${item.location.full}\n${error.stack ?? error.message}`);

	try {
		await alert(interaction, generateUnexpectedErrorMessage(interaction, error));
	} catch (error) {
		client.emit(Events.Error, error as Error);
	}

	return undefined;
}

export async function handleEventRunError(error: Error, payload: ErrorEventPayload) {
	const { client, logger } = container;
	const { interaction, event } = payload;

	if (error instanceof UserError) return userError(interaction, error);

	if (error.name === 'AbortError' || error.message === 'Internal Server Error') {
		return alert(interaction, 'I had a small network hiccup. Please try again.');
	}

	logger.fatal(`[EVENT] ${event.location.full}\n${error.stack ?? error.message}`);

	try {
		await alert(interaction, generateUnexpectedErrorMessage(interaction, error));
	} catch (error) {
		client.emit(Events.Error, error as Error);
	}

	return undefined;
}
