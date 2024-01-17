import { diffWordsWithSpace } from 'diff';
import { escapeMarkdown } from 'discord.js';

export function getDifference(previous: string, next: string) {
	return diffWordsWithSpace(escapeMarkdown(previous), escapeMarkdown(next))
		.map(result => (result.added ? `**${result.value}**` : result.removed ? `~~${result.value}~~` : result.value))
		.join('');
}
