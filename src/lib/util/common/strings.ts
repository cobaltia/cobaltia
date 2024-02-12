import { diffWordsWithSpace } from 'diff';
import { escapeMarkdown } from 'discord.js';

/**
 * Get the difference between the old and new content
 *
 * @param previous - The old content
 * @param next - The new content
 */
export function getDifference(previous: string, next: string) {
	return diffWordsWithSpace(escapeMarkdown(previous), escapeMarkdown(next))
		.map(result => (result.added ? `**${result.value}**` : result.removed ? `~~${result.value}~~` : result.value))
		.join('');
}

/**
 * Truncate a string to a certain length
 *
 * @param str - The string to truncate
 * @param length - The max length of the string
 * @returns The truncated string minus the last 3 characters
 */
export function truncate(str: string, length: number) {
	return str.length > length ? `${str.slice(0, length - 3)}...` : str;
}
