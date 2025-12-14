import { Command } from '@sapphire/framework';
import { type Message } from 'discord.js';

export class TestCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			name: 'test',
			description: 'A test command.',
			detailedDescription: 'This is a detailed description of the test command.',
		});
	}

	public async messageRun(message: Message) {
		if ('send' in message.channel && typeof message.channel.send === 'function') {
			await message.channel.send('Test command executed successfully!');
		}
	}
}
