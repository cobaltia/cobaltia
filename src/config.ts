import process from 'node:process';
import { URL } from 'node:url';
import { setup } from '@skyra/env-utilities';
import { type ClientOptions, GatewayIntentBits, Partials } from 'discord.js';

process.env.NODE_ENV ??= 'development';

setup(new URL('../.env', import.meta.url));

export const CLIENT_OPTIONS: ClientOptions = {
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildMembers,
	],
	partials: [Partials.Message, Partials.GuildMember],
};
