import type { Guild, Message, User } from 'discord.js';
import { describe, expect, it } from 'vitest';
import {
	getAttachment,
	getContent,
	getImage,
	getTag,
	isGuildMessage,
	isUniqueUsername,
	IMAGE_EXTENSION,
} from '#util/discord-utilities';

function createMessage(overrides: Record<string, unknown> = {}): Message {
	return {
		content: '',
		embeds: [],
		attachments: {
			size: 0,
			find: () => undefined,
		} as any,
		stickers: {
			first: () => undefined,
		} as any,
		guild: null,
		channel: {} as any,
		...overrides,
	} as unknown as Message;
}

describe('isGuildMessage', () => {
	it('returns true when a guild is present', () => {
		const guild = {} as Guild;
		const message = createMessage({ guild });
		expect(isGuildMessage(message)).toBe(true);
	});

	it('returns false when guild is null', () => {
		const message = createMessage({ guild: null });
		expect(isGuildMessage(message)).toBe(false);
	});
});

describe('getContent', () => {
	it('returns message content when available', () => {
		const message = createMessage({ content: 'hello world' });
		expect(getContent(message)).toBe('hello world');
	});

	it('falls back to embed description', () => {
		const message = createMessage({
			content: '',
			embeds: [{ description: 'from embed', fields: [] }] as any,
		});
		expect(getContent(message)).toBe('from embed');
	});

	it('falls back to first embed field value', () => {
		const message = createMessage({
			content: '',
			embeds: [{ description: null, fields: [{ value: 'field text' }] }] as any,
		});
		expect(getContent(message)).toBe('field text');
	});

	it('returns null when no content is found', () => {
		const message = createMessage({
			content: '',
			embeds: [{ description: null, fields: [] }] as any,
		});
		expect(getContent(message)).toBeNull();
	});
});

describe('getAttachment', () => {
	it('returns image attachment when present on the message', () => {
		const attachment = {
			name: 'nice.png',
			url: 'https://cdn/image.png',
			proxyURL: 'https://proxy/image.png',
			height: 200,
			width: 300,
		};
		const message = createMessage({
			attachments: {
				size: 1,
				find: (predicate: (value: typeof attachment) => boolean) =>
					predicate(attachment) ? attachment : undefined,
			} as any,
		});
		expect(getAttachment(message)).toEqual({
			url: attachment.url,
			proxyURL: attachment.proxyURL,
			height: attachment.height,
			width: attachment.width,
		});
	});

	it('falls back to embed image metadata', () => {
		const message = createMessage({
			embeds: [
				{
					thumbnail: null,
					image: {
						url: 'https://cdn/embed.png',
						proxyURL: 'https://proxy/embed.png',
						height: 400,
						width: 500,
					},
				},
			] as any,
		});
		expect(getAttachment(message)).toEqual({
			url: 'https://cdn/embed.png',
			proxyURL: 'https://proxy/embed.png',
			height: 400,
			width: 500,
		});
	});

	it('uses embed thumbnail when no attachment or embed image exists', () => {
		const message = createMessage({
			embeds: [
				{
					image: null,
					thumbnail: {
						url: 'https://cdn/thumb.png',
						proxyURL: 'https://proxy/thumb.png',
						height: 64,
						width: 64,
					},
				},
			] as any,
		});
		expect(getAttachment(message)).toEqual({
			url: 'https://cdn/thumb.png',
			proxyURL: 'https://proxy/thumb.png',
			height: 64,
			width: 64,
		});
	});

	it('returns null when no attachment metadata is available', () => {
		const message = createMessage();
		expect(getAttachment(message)).toBeNull();
	});
});

describe('getImage', () => {
	it('prefers proxyURL from attachment when available', () => {
		const message = createMessage({
			attachments: {
				size: 1,
				find: () => ({
					name: 'photo.jpg',
					url: 'https://cdn/photo.jpg',
					proxyURL: 'https://proxy/photo.jpg',
					height: 100,
					width: 100,
				}),
			} as any,
		});
		expect(getImage(message)).toBe('https://proxy/photo.jpg');
	});

	it('falls back to sticker when no attachment exists', () => {
		const message = createMessage({
			stickers: {
				first: () => ({ url: 'https://cdn/sticker.png' }),
			} as any,
		});
		expect(getImage(message)).toBe('https://cdn/sticker.png');
	});

	it('returns null when no media is found', () => {
		const message = createMessage();
		expect(getImage(message)).toBeNull();
	});
});

describe('isUniqueUsername', () => {
	it('returns true when discriminator is 0', () => {
		const user = { discriminator: '0' } as User;
		expect(isUniqueUsername(user)).toBe(true);
	});

	it('returns false when discriminator is a classic value', () => {
		const user = { discriminator: '1337' } as User;
		expect(isUniqueUsername(user)).toBe(false);
	});
});

describe('getTag', () => {
	it('returns username only for unique usernames', () => {
		const user = { username: 'cobalt', discriminator: '0' } as User;
		expect(getTag(user)).toBe('cobalt');
	});

	it('returns username#discriminator for classic accounts', () => {
		const user = { username: 'cobalt', discriminator: '1234' } as User;
		expect(getTag(user)).toBe('cobalt#1234');
	});
});

describe('IMAGE_EXTENSION', () => {
	it('matches supported extensions case-insensitively', () => {
		expect(IMAGE_EXTENSION.test('picture.PNG')).toBe(true);
		expect(IMAGE_EXTENSION.test('photo.jpeg')).toBe(true);
	});

	it('rejects unsupported extensions', () => {
		expect(IMAGE_EXTENSION.test('document.txt')).toBe(false);
		expect(IMAGE_EXTENSION.test('image.svg')).toBe(false);
	});
});
