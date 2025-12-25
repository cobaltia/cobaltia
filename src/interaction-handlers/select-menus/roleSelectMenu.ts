import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
	type GuildMemberRoleManager,
	type MessageActionRowComponentBuilder,
	type Role,
	type StringSelectMenuInteraction,
	ActionRowBuilder,
	MessageFlags,
	StringSelectMenuBuilder,
} from 'discord.js';
import { ROLES } from '#lib/util/constants';

export class RoleSelectMenuHandler extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.SelectMenu,
		});
	}

	public override parse(interaction: StringSelectMenuInteraction) {
		const customId = interaction.customId;
		if (customId !== 'select-menu:roles') return this.none();

		return this.some();
	}

	public async run(interaction: StringSelectMenuInteraction) {
		const values = interaction.values;
		const memberRoles = interaction.member?.roles as GuildMemberRoleManager;
		await interaction.deferUpdate();

		const rolesToRemove: Role[] = [];
		const rolesToAdd: Role[] = [];

		for (const value of values) {
			const role = interaction.guild?.roles.cache.get(value);
			if (role) {
				if (memberRoles.cache.has(role.id)) {
					rolesToRemove.push(role);
				} else {
					rolesToAdd.push(role);
				}
			}
		}

		await memberRoles.remove(rolesToRemove);
		await memberRoles.add(rolesToAdd);

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId('select-menu:roles')
					.addOptions(...ROLES)
					.setMaxValues(22),
			),
		];

		await interaction.editReply({ components });

		const message = ['Updated Roles!'];
		if (rolesToRemove.length) message.push(`Removed ${rolesToRemove.join(', ')}`);
		if (rolesToAdd.length) message.push(`Added ${rolesToAdd.join(', ')}`);

		await interaction.followUp({ content: message.join('\n'), flags: MessageFlags.Ephemeral });
	}
}
