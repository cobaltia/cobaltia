import type { LoginData } from '@sapphire/plugin-api';
import type { FlattenedGuild, FlattenedUser } from '#lib/api/ApiTransformers';

export interface PartialOauthFlattenedGuild extends Omit<FlattenedGuild, 'features' | 'joinedTimestamp' | 'ownerId'> {
	joinedTimestamp: FlattenedGuild['joinedTimestamp'] | null;
	ownerId: FlattenedGuild['ownerId'] | null;
}

export interface OauthFlattenedGuild extends PartialOauthFlattenedGuild {
	cobaltiaIsIn: boolean;
	manageable: boolean;
	permissions: string;
}

export interface OauthFlattenedUser {
	guilds: OauthFlattenedGuild[];
	user: FlattenedUser;
}

export interface TransformedLoginData extends LoginData {
	transformedGuilds?: OauthFlattenedGuild[];
}
