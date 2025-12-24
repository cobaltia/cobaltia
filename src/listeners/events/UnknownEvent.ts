import { Listener } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { Events, type UnknownEventPayload } from '#lib/types';

export class UnknownEventListener extends Listener<typeof Events.UnknownEvent> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.UnknownEvent });
	}

	public async run(payload: UnknownEventPayload) {
		const { interaction } = payload;

		return interaction.reply({
			content: 'This event does not exist.',
			allowedMentions: { users: [interaction.user.id], roles: [] },
			flags: MessageFlags.Ephemeral,
		});
	}
}
