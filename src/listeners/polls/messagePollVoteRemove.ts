import { Listener } from '@sapphire/framework';
import { type PollAnswer, type Snowflake, Events } from 'discord.js';

export class MessagePollVoteRemove extends Listener<typeof Events.MessagePollVoteRemove> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.MessagePollVoteRemove,
		});
	}

	public run(pollAnswer: PollAnswer, userId: Snowflake) {
		console.log('voted');
		console.log(pollAnswer, userId);
	}
}
