/* eslint-disable typescript-sort-keys/interface */
import type { Message } from 'discord.js';
import type { GuildMessage } from '#lib/types';

/**
 * Image extensions:
 * - bmp
 * - jpg
 * - jpeg
 * - png
 * - gif
 * - webp
 */
// eslint-disable-next-line prefer-named-capture-group
export const IMAGE_EXTENSION = /\.(bmp|jpe?g|png|gif|webp)$/i;

export function isGuildMessage(message: Message): message is GuildMessage {
	return message.guild !== null;
}

export function getContent(message: Message) {
	if (message.content) return message.content;
	for (const embed of message.embeds) {
		if (embed.description) return embed.description;
		if (embed.fields.length) return embed.fields[0].value;
	}

	return null;
}

export interface ImageAttachment {
	url: string;
	proxyURL: string;
	height: number;
	width: number;
}

export function getAttachment(message: Message): ImageAttachment | null {
	if (message.attachments.size) {
		const attachment = message.attachments.find(att => IMAGE_EXTENSION.test(att.name ?? att.url));
		if (attachment) {
			return {
				url: attachment.url,
				proxyURL: attachment.proxyURL,
				height: attachment.height!,
				width: attachment.width!,
			};
		}
	}

	for (const embed of message.embeds) {
		if (embed.image) {
			return {
				url: embed.image.url,
				proxyURL: embed.image.proxyURL!,
				height: embed.image.height!,
				width: embed.image.width!,
			};
		}

		if (embed.thumbnail) {
			return {
				url: embed.thumbnail.url,
				proxyURL: embed.thumbnail.proxyURL!,
				height: embed.thumbnail.height!,
				width: embed.thumbnail.width!,
			};
		}
	}

	return null;
}

export function getImage(message: Message) {
	const attachment = getAttachment(message);
	if (attachment) return attachment.proxyURL || attachment.url;

	const sticker = message.stickers.first();
	if (sticker) return sticker.url;
	return null;
}
