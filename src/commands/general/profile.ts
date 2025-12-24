import { type User as PrismaUser } from '@prisma/client';
import { Command, Result } from '@sapphire/framework';
import {
	type User,
	ApplicationCommandType,
	ActionRowBuilder,
	type MessageActionRowComponentBuilder,
	StringSelectMenuBuilder,
} from 'discord.js';
import { getUser } from '#lib/database';
import { profileEmbed } from '#util/discord-embeds';

export class ProfileCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Get your profile.',
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addUserOption(options =>
					options.setName('user').setDescription('The user to get the profile of.').setRequired(false),
				),
		);

		registry.registerContextMenuCommand(builder =>
			builder.setName('View Profile').setType(ApplicationCommandType.User),
		);
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const user = interaction.options.getUser('user') ?? interaction.user;

		const result = await Result.fromAsync(async () => getUser(user.id));
		if (result.isErr()) throw result.unwrapErr();
		const data = result.unwrap();
		return this.handleOk(interaction, data, user);
	}

	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		await interaction.deferReply();
		const user = await this.container.client.users.fetch(interaction.targetId);

		const result = await Result.fromAsync(async () => getUser(user.id));
		if (result.isErr()) throw result.unwrapErr();
		const data = result.unwrap();

		return this.handleOk(interaction, data, user);
	}

	private async handleOk(
		interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction,
		data: PrismaUser,
		user: User,
	) {
		const embed = await profileEmbed(data, user);

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`select-menu:profile:${user.id}`)
					.addOptions([
						{ label: 'Main Profile', value: 'profile', default: true },
						{ label: 'Experience Stats', value: 'experience' },
						{ label: 'Inventory', value: 'inventory' },
					])
					.setPlaceholder('Select a different profile view'),
			),
		];
		return interaction.editReply({
			embeds: [embed],
			components,
		});
	}
}
