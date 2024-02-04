/* eslint-disable unicorn/new-for-builtins */
import {
	UserError,
	type InteractionHandlerError,
	type InteractionHandlerParseError,
	Events,
	type InteractionHandler,
	container,
} from '@sapphire/framework';
import { codeBlock, EmbedBuilder, type Interaction } from 'discord.js';
import { OWNERS } from '#root/config';
import { Colors } from '#util/constants';
import { getErrorLine, getLinkLine } from './errorHelpers.js';

const unknownErrorMessage =
	'An error occurred that I was not able to identify. Please try again. If error persists, please contact Juan.';

export async function handleInteractionError(
	error: Error,
	{ handler, interaction }: InteractionHandlerError | InteractionHandlerParseError,
) {
	if (error instanceof UserError) return userError(interaction, error);

	const { client, logger } = handler.container;

	if (error.name === 'AbortError' || error.message === 'Internal Server Error') {
		return alert(interaction, 'I had a small network hiccup. Please try again.');
	}

	await sendErrorChannel(interaction, handler, error);

	logger.fatal(`[HANDLER] ${handler.location.full}\n${error.stack ?? error.message}`);
	try {
		await alert(interaction, generateUnexpectedErrorMessage(interaction, error));
	} catch (error) {
		client.emit(Events.Error, error as Error);
	}
}

function generateUnexpectedErrorMessage(interaction: Interaction, error: Error) {
	if (OWNERS.includes(interaction.user.id)) return codeBlock('js', error.stack!);
	return `I found an unexpected error, please report the steps you have taken to Juan.`;
}

async function userError(interaction: Interaction, error: UserError) {
	if (Reflect.get(Object(error.context), 'silent')) return;

	return alert(interaction, error.message || unknownErrorMessage);
}

async function alert(interaction: Interaction, content: string) {
	if (!interaction.isAnySelectMenu() && !interaction.isButton()) return;

	if (interaction.replied || interaction.deferred) {
		return interaction.editReply({
			content,
			allowedMentions: { users: [interaction.user.id], roles: [] },
		});
	}

	return interaction.reply({
		content,
		allowedMentions: { users: [interaction.user.id], roles: [] },
		ephemeral: true,
	});
}

async function sendErrorChannel(interaction: Interaction, handler: InteractionHandler, error: Error) {
	const webhook = container.webhookError;
	if (!webhook || (!interaction.isAnySelectMenu() && !interaction.isButton())) return;

	const interactionReply = await interaction.fetchReply();

	const lines = [getLinkLine(interactionReply), getHandlerLine(handler), getErrorLine(error)];

	const embed = new EmbedBuilder().setDescription(lines.join('\n')).setColor(Colors.Red).setTimestamp();

	try {
		await webhook.send({ embeds: [embed] });
	} catch (error) {
		container.client.emit(Events.Error, error as Error);
	}
}

function getHandlerLine(handler: InteractionHandler) {
	return `Handler: ${handler.location.full}`;
}
