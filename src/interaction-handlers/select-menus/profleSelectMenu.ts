import { InteractionHandler, InteractionHandlerTypes, Result, container } from '@sapphire/framework';
import { roundNumber } from '@sapphire/utilities';
import {
	ActionRowBuilder,
	EmbedBuilder,
	inlineCode,
	type MessageActionRowComponentBuilder,
	StringSelectMenuBuilder,
	type StringSelectMenuInteraction,
	time,
	TimestampStyles,
} from 'discord.js';
import { getUser } from '#lib/database';
import { formatNumber } from '#util/common';
import { profileEmbed } from '#util/discord-embeds';
import { nextLevel } from '#util/experience';

export class ProfileSelectMenuHandler extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.SelectMenu,
		});
	}

	public override parse(interaction: StringSelectMenuInteraction) {
		const customId = interaction.customId;
		const userId = customId.split(':')[2];
		if (customId.startsWith('select-menu:profile')) return this.some({ userId });

		return this.none();
	}

	public async run(interaction: StringSelectMenuInteraction, result: InteractionHandler.ParseResult<this>) {
		const value = interaction.values[0];
		if (value === 'profile') return this.handleProfile(interaction, result);
		if (value === 'experience') return this.handleExperience(interaction, result);
		if (value === 'cooldown') return this.handleCooldown(interaction, result);
	}

	private async handleProfile(
		interaction: StringSelectMenuInteraction,
		result: InteractionHandler.ParseResult<this>,
	) {
		await interaction.deferUpdate();
		const userId = result.userId;
		const user = await this.container.client.users.fetch(userId);

		const dataResult = await Result.fromAsync(async () => getUser(userId));

		if (dataResult.isErr()) throw dataResult.unwrapErr();

		const data = dataResult.unwrap();
		const embed = await profileEmbed(data, user);

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`select-menu:profile:${user.id}`)
					.addOptions([
						{ label: 'Main Profile', value: 'profile', default: true },
						{ label: 'Experience Stats', value: 'experience' },
						{ label: 'Cooldowns', value: 'cooldown' },
					])
					.setPlaceholder('Select a different profile view'),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleExperience(
		interaction: StringSelectMenuInteraction,
		result: InteractionHandler.ParseResult<this>,
	) {
		await interaction.deferUpdate();
		const userId = result.userId;
		const user = await this.container.client.users.fetch(userId);

		const dataResult = await Result.fromAsync(async () => getUser(userId));
		if (dataResult.isErr()) dataResult.unwrapErr();

		const users = await container.prisma.user.findMany({
			orderBy: [
				{
					level: 'desc',
				},
				{
					experience: 'desc',
				},
			],
		});

		const data = dataResult.unwrap();
		const next = nextLevel(data.level).unwrap();
		const description = [
			`Level: ${inlineCode(formatNumber(data.level)!)}`,
			`Experience: ${inlineCode(`${data.experience}/${next}`)}`,
			`Progress: ${inlineCode(`${roundNumber((data.experience / next) * 100, 2)}%`)}`,
		];
		const embed = new EmbedBuilder()
			.setTitle(`${user.tag}'s Experience Stats`)
			.setDescription(description.join('\n'))
			.setFooter({ text: `Leaderboard Position: #${users.findIndex(user => user.id === userId) + 1}` });

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`select-menu:profile:${user.id}`)
					.addOptions([
						{ label: 'Main Profile', value: 'profile' },
						{ label: 'Experience Stats', value: 'experience', default: true },
						{ label: 'Cooldowns', value: 'cooldown' },
					])
					.setPlaceholder('Select a different profile view'),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}

	private async handleCooldown(
		interaction: StringSelectMenuInteraction,
		result: InteractionHandler.ParseResult<this>,
	) {
		await interaction.deferUpdate();
		const userId = result.userId;
		const user = await this.container.client.users.fetch(userId);

		const dataResult = await Result.fromAsync(async () => getUser(userId));
		if (dataResult.isErr()) dataResult.unwrapErr();

		const data = dataResult.unwrap();
		const description = [];
		if (data.workCooldown.getTime() > Date.now()) {
			const date = roundNumber(data.workCooldown.getTime() / 1_000);
			description.push(`Work: ${time(date, TimestampStyles.ShortDateTime)}`);
		}

		const embed = new EmbedBuilder()
			.setTitle(`${user.tag}'s Cooldowns`)
			.setDescription(description.join('\n') || 'No cooldowns active.');

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`select-menu:profile:${user.id}`)
					.addOptions([
						{ label: 'Main Profile', value: 'profile' },
						{ label: 'Experience Stats', value: 'experience' },
						{ label: 'Cooldowns', value: 'cooldown', default: true },
					])
					.setPlaceholder('Select a different profile view'),
			),
		];

		await interaction.editReply({ embeds: [embed], components });
	}
}
