import { type User } from 'discord.js';

export function flattenUser(user: User): FlattenedUser {
	return {
		id: user.id,
		bot: user.bot,
		avatar: user.avatar,
		username: user.username,
		displayName: user.displayName,
		discriminator: user.discriminator,
	};
}

export interface FlattenedUser {
	avatar: string | null;
	bot: boolean;
	discriminator: string;
	displayName: string;
	id: string;
	username: string;
}
