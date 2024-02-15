import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { OWNERS } from '#root/config';

export class OwnerOnlyPrecondition extends Precondition {
	#message = 'This command can only be used by the bot owner.';

	public override async chatInputRun(interaction: CommandInteraction) {
		return this.doOwnerCheck(interaction.user.id);
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		return this.doOwnerCheck(interaction.user.id);
	}

	private doOwnerCheck(userId: string) {
		return OWNERS.includes(userId) ? this.ok() : this.error({ message: this.#message });
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		OwnerOnly: never;
	}
}
