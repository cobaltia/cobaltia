import { Listener } from '@sapphire/framework';
import { Events, type UnknownEventPayload } from '#lib/types';

export class UnknownEventListener extends Listener<typeof Events.UnkonwnEvent> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.UnkonwnEvent });
	}

	public async run(payload: UnknownEventPayload) {
		const { interaction } = payload;

		return interaction.reply({
			content: 'This event does not exist.',
			allowedMentions: { users: [interaction.user.id], roles: [] },
			ephemeral: true,
		});
	}
}
