import { Listener } from '@sapphire/framework';
import { Events, type UnknownItemPayload } from '#lib/types';

export class UnknownItemListener extends Listener<typeof Events.UnknownItem> {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.UnknownItem });
	}

	public async run(payload: UnknownItemPayload) {
		const { interaction } = payload;

		return interaction.reply({
			content: 'This item does not exist.',
			allowedMentions: { users: [interaction.user.id], roles: [] },
			ephemeral: true,
		});
	}
}
