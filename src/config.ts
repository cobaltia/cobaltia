import process from 'node:process';
import { URL } from 'node:url';
import { BucketScope } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
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
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
	],
	partials: [Partials.Message, Partials.GuildMember],
	defaultCooldown: {
		delay: 2 * Time.Second,
		limit: 1,
		scope: BucketScope.User,
	},
};
