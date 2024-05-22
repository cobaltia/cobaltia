import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { mainGuildId } from '#lib/util/constants';

export class CobaltOnly extends Precondition {
	#message = 'This command can only be ran in Cobalt Network.';

	public override async chatInputRun(interaction: CommandInteraction) {
		return this.doCobaltCheck(interaction.guildId);
	}

	public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
		return this.doCobaltCheck(interaction.guildId);
	}

	private doCobaltCheck(guildId: string | null) {
		return guildId === mainGuildId ? this.ok() : this.error({ message: this.#message });
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		CobaltOnly: never;
	}
}
