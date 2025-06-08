import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuCommandInteraction, User } from 'discord.js';

export class ExecutiveOnlyPrecondition extends Precondition {
	#message = 'This command can only be used by an executive.';

	public override async chatInputRun(interaction: CommandInteraction) {
		return this.doExecutiveCheck(interaction.user);
	}

	public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
		return this.doExecutiveCheck(interaction.user);
	}

	private async doExecutiveCheck(user: User) {
		const cobaltGuild = await this.container.client.guilds.fetch('322505254098698240');
		const cobaltMember = cobaltGuild.members.cache.get(user.id);
		if (!cobaltMember) return this.error({ message: 'You are not in the server.' });
		return cobaltMember.roles.cache.has('322512963846275083') ? this.ok() : this.error({ message: this.#message });
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		ExecutiveOnly: never;
	}
}
