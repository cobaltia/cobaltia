import { Listener } from '@sapphire/framework';
import { type PollAnswer, type Snowflake, Events } from 'discord.js';

export class MessagePollVoteAdd extends Listener<typeof Events.MessagePollVoteAdd> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.MessagePollVoteAdd,
		});
	}

	public async run(pollAnswer: PollAnswer, userId: Snowflake) {
		console.log('voted');
		console.log(pollAnswer, userId);
		console.log(pollAnswer.poll);
		console.log(await pollAnswer.fetchVoters());
	}
}
