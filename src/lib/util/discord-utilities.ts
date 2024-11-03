/* eslint-disable typescript-sort-keys/interface */
import { setTimeout } from 'node:timers';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { isNullishOrEmpty } from '@sapphire/utilities';
import type { Guild, Message, MessageCreateOptions, MessagePayload, User } from 'discord.js';
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

export async function sendTemporaryMessage(
	message: GuildMessage | Message,
	options: MessageCreateOptions | MessagePayload | string,
	timeout = 5_000,
) {
	if (isTextBasedChannel(message.channel)) {
		const msg = await message.channel.send(options);
		setTimeout(async () => msg.delete(), timeout);
	}
}

export function isUniqueUsername(user: User) {
	return isNullishOrEmpty(user.discriminator) || user.discriminator === '0';
}

export function getTag(user: User) {
	return isUniqueUsername(user) ? `${user.username}` : `${user.username}#${user.discriminator}`;
}

// TODO(Isidro): Account for social credit
export async function calculateBonus(user: User, guild: Guild) {
	let bonus = 0;
	const member = await guild.members.fetch(user.id);
	const citizen = '513027436208848896';
	const patriot = '513182271985942538';
	const booster = '698994055954300959';
	if (member.roles.cache.has(citizen)) bonus += 2; // 2%
	if (member.roles.cache.has(patriot)) bonus += 3; // 3%
	if (member.roles.cache.has(booster)) bonus += 5; // 5%
	return bonus;
}
