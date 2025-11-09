import { Precondition, Result } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuCommandInteraction, User } from 'discord.js';

export class MinisterOnlyPrecondition extends Precondition {
	#message = 'This command can only be used by a minister.';

	public override async chatInputRun(interaction: CommandInteraction) {
		return this.doMinisterCheck(interaction.user);
	}

	public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
		return this.doMinisterCheck(interaction.user);
	}

	private async doMinisterCheck(user: User) {
		const result = await Result.fromAsync(async () =>
			this.container.prisma.client.findUniqueOrThrow({ where: { id: this.container.client.id! } }),
		);
		if (result.isErr()) return this.error({ message: "Couldn't connect to the database" });

		const clientData = result.unwrap();
		const isMinister = clientData.ministers.find(id => id === user.id);
		if (!isMinister) return this.error({ message: this.#message });
		return this.ok();
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		MinisterOnly: never;
	}
}
