import { isNullishOrEmpty } from '@sapphire/utilities';
import type { User } from 'discord.js';

export function isUniqueUsername(user: User) {
	return isNullishOrEmpty(user.discriminator) || user.discriminator === '0';
}

export function getTag(user: User) {
	return isUniqueUsername(user) ? `${user.username}` : `${user.username}#${user.discriminator}`;
}
