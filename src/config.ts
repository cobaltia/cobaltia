/* eslint-disable unicorn/numeric-separators-style */
import process from 'node:process';
import { URL } from 'node:url';
import type { Prisma } from '@prisma/client';
import { BucketScope, LogLevel } from '@sapphire/framework';
import type { ServerOptionsAuth, ServerOptions } from '@sapphire/plugin-api';
import { Time } from '@sapphire/time-utilities';
import type { ArrayString, BooleanString } from '@skyra/env-utilities';
import { envIsDefined, envParseArray, envParseBoolean, envParseString, setup } from '@skyra/env-utilities';
import type { OAuth2Scopes, ClientOptions, WebhookClientData } from 'discord.js';
import { GatewayIntentBits, Partials } from 'discord.js';

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

function parsePrismaLogging(): Prisma.LogLevel[] {
	return process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'];
}

function parseApiAuth(): ServerOptionsAuth | undefined {
	if (!envIsDefined('OAUTH_SECRET')) return undefined;

	return {
		id: envParseString('CLIENT_ID'),
		secret: envParseString('OAUTH_SECRET'),
		cookie: envParseString('OAUTH_COOKIE'),
		redirect: envParseString('OAUTH_REDIRECT_URL'),
		scopes: envParseArray('OAUTH_SCOPE') as OAuth2Scopes[],
		domainOverwrite: envParseString('OAUTH_DOMAIN_OVERWRITE'),
	};
}

function parseApi(): ServerOptions | undefined {
	if (!envParseBoolean('API_ENABLED', false)) return undefined;

	return {
		auth: parseApiAuth(),
		origin: envParseString('API_ORIGIN'),
		listenOptions: {
			port: 8282,
		},
	};
}

export const WEBHOOK_ERROR = parseWebhookError();
export const REDIS_URI = parseRedisUri();
export const PRISMA_LOGGING = parsePrismaLogging();

export const CLIENT_OPTIONS: ClientOptions = {
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
	],
	partials: [Partials.Message, Partials.GuildMember],
	loadDefaultErrorListeners: false,
	loadSubcommandErrorListeners: false,
	caseInsensitiveCommands: true,
	loadMessageCommandListeners: true,
	defaultCooldown: {
		delay: 5 * Time.Second,
		limit: 1,
		scope: BucketScope.User,
	},
	logger: {
		level: process.env.NODE_ENV === 'production' ? LogLevel.Info : LogLevel.Debug,
	},
	api: parseApi(),
};

declare module '@skyra/env-utilities' {
	interface Env {
		API_ENABLED: BooleanString;
		API_ORIGIN: string;
		CLIENT_ID: string;
		OAUTH_COOKIE: string;
		OAUTH_DOMAIN_OVERWRITE: string;
		OAUTH_REDIRECT_URL: string;
		OAUTH_SCOPE: ArrayString;
		OAUTH_SECRET: string;
		REDIS_URI: string;
		WEBHOOK_ERROR_ID: string;
		WEBHOOK_ERROR_TOKEN: string;
	}
}
