import { COBALT_GUILD_ID } from '#lib/util/constants';
import { Precondition } from '@sapphire/framework';
import { type ContextMenuCommandInteraction, type CommandInteraction } from 'discord.js';

export class CobaltOnlyPrecondition extends Precondition {
	#mesage = 'This command can only be used in the Cobalt Network server.';

	public override async chatInputRun(interaction: CommandInteraction) {
		return this.doCobaltCheck(interaction);
	}

	public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
		return this.doCobaltCheck(interaction);
	}

	private async doCobaltCheck(interaction: CommandInteraction | ContextMenuCommandInteraction) {
		const guildId = interaction.guildId;
		if (guildId !== COBALT_GUILD_ID) return this.error({ message: this.#mesage });
		return this.ok();
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		CobaltOnly: never;
	}
}
