import process from 'node:process';
import { URL } from 'node:url';
import { BucketScope } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { envParseString, setup } from '@skyra/env-utilities';
import { type ClientOptions, GatewayIntentBits, Partials, type WebhookClientData } from 'discord.js';

process.env.NODE_ENV ??= 'development';
export const OWNERS = ['288703114473635841'];

setup(new URL('../.env', import.meta.url));

function parseWebhookError(): WebhookClientData | null {
	const { WEBHOOK_ERROR_TOKEN } = process.env;
	if (!WEBHOOK_ERROR_TOKEN) return null;

	return {
		id: envParseString('WEBHOOK_ERROR_ID'),
		token: WEBHOOK_ERROR_TOKEN,
	};
}

function parseRedisUri() {
	return envParseString('REDIS_URI', 'redis://localhost:6379');
}

export const WEBHOOK_ERROR = parseWebhookError();
export const REDIS_URI = parseRedisUri();

export const CLIENT_OPTIONS: ClientOptions = {
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessagePolls,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
	],
	partials: [Partials.Message, Partials.GuildMember],
	loadDefaultErrorListeners: false,
	loadSubcommandErrorListeners: false,
	defaultCooldown: {
		delay: 5 * Time.Second,
		limit: 1,
		scope: BucketScope.User,
	},
};

declare module '@skyra/env-utilities' {
	interface Env {
		REDIS_URI: string;
		WEBHOOK_ERROR_ID: string;
		WEBHOOK_ERROR_TOKEN: string;
	}
}
