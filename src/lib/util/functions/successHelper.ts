import {
	container,
	type ChatInputCommandSuccessPayload,
	type ContextMenuCommandSuccessPayload,
} from '@sapphire/framework';
import type { RunSuccessEventPayload, type RunSuccessItemPayload } from '#lib/types';

export function handleChatInputOrContextMenuCommandSuccess(
	payload: ChatInputCommandSuccessPayload | ContextMenuCommandSuccessPayload,
) {
	const { commandName, author, runTime } = getSuccessData(payload);
	container.metrics.incrementCommand({
		command: commandName,
		user: payload.interaction.user.id,
		channel: payload.interaction.channelId,
		guild: payload.interaction.guildId ?? 'none',
		success: true,
	});
	container.logger.info(`${author} - ${commandName} (${runTime})`);
}

function getDuration(duration: number) {
	if (duration >= 1_000) return `${(duration / 1_000).toFixed(2)}s`;
	if (duration >= 1) return `${duration.toFixed(2)}ms`;
	return `${(duration * 1_000).toFixed(2)}μs`;
}

function getSuccessData({
	interaction,
	command,
	duration,
}: ChatInputCommandSuccessPayload | ContextMenuCommandSuccessPayload) {
	const commandName = command.name;
	const author = `${interaction.user.username} [${interaction.user.id}]`;
	const runTime = getDuration(duration);

	return { commandName, author, runTime };
}

function getSuccessItemData({ interaction, item, duration }: RunSuccessItemPayload) {
	const itemName = item.displayName;
	const author = `${interaction.user.username} [${interaction.user.id}]`;
	const runTime = getDuration(duration);

	return { itemName, author, runTime };
}

export function handleItemSuccess(payload: RunSuccessItemPayload) {
	const { itemName, author, runTime } = getSuccessItemData(payload);
	const { interaction } = payload;
	container.metrics.incrementItemLost({
		item: itemName,
		user: interaction.user.id,
		guild: interaction.guildId ?? 'none',
		channel: interaction.channelId,
		reason: 'use',
	});

	container.logger.info(`${author} - ${itemName} (${runTime})`);
}

function getSuccessEventData({ interaction, event, duration }: RunSuccessEventPayload) {
	const eventName = event.name;
	const author = `${interaction.user.username} [${interaction.user.id}]`;
	const runTime = getDuration(duration);

	return { eventName, author, runTime };
}

export function handleEventSuccess(payload: RunSuccessEventPayload) {
	const { eventName, author, runTime } = getSuccessEventData(payload);

	// TODO(Isidro): Add metrics for event success when applicable

	container.logger.info(`${author} - ${eventName} (${runTime})`);
}
