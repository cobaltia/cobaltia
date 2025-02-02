import {
	container,
	type ChatInputCommandSuccessPayload,
	type ContextMenuCommandSuccessPayload,
} from '@sapphire/framework';
import { type RunSuccessItemPayload } from '#lib/types';

export function handleChatInputOrContextMenuCommandSuccess(
	payload: ChatInputCommandSuccessPayload | ContextMenuCommandSuccessPayload,
) {
	const { commandName, author, runTime } = getSuccessData(payload);
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
	const itemName = item.name;
	const author = `${interaction.user.username} [${interaction.user.id}]`;
	const runTime = getDuration(duration);

	return { itemName, author, runTime };
}

export function handleItemSuccess(payload: RunSuccessItemPayload) {
	const { itemName, author, runTime } = getSuccessItemData(payload);

	container.logger.info(`${author} - ${itemName} (${runTime})`);
}
