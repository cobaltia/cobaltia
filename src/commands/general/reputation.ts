import { UserError } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { Result } from '@sapphire/result';
import { Time } from '@sapphire/time-utilities';
import { roundNumber } from '@sapphire/utilities';
import { EmbedBuilder, TimestampStyles, inlineCode, time } from 'discord.js';
import { getUser } from '#lib/database';

export class ReputationCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'Manage your reputation.',
			subcommands: [
				{ name: 'give', chatInputRun: 'chatInputGive' },
				{ name: 'check', chatInputRun: 'chatInputCheck' },
			],
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand(command =>
					command
						.setName('give')
						.setDescription('Give reputation to another user.')
						.addUserOption(option =>
							option.setName('user').setDescription('The user to give reputation to.').setRequired(true),
						),
				)
				.addSubcommand(command => command.setName('check').setDescription('Check your reputation.')),
		);
	}

	public async chatInputGive(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const user = interaction.options.getUser('user', true);

		if (user.id === interaction.user.id) {
			throw new UserError({
				identifier: 'reputationGiveSelf',
				message: 'You cannot give reputation to yourself.',
			});
		}

		const giveResult = await Result.fromAsync(() => getUser(interaction.user.id));
		if (giveResult.isErr()) throw giveResult.unwrapErr();

		const targetResult = await Result.fromAsync(() => getUser(user.id));
		if (targetResult.isErr()) throw targetResult.unwrapErr();

		const giver = giveResult.unwrap();
		const target = targetResult.unwrap();

		const cooldown = giver.reputationCooldown.getTime();
		const now = Date.now();
		if (cooldown > now) {
			const date = roundNumber(cooldown / Time.Second);
			return interaction.followUp(`You can give reputation again ${time(date, TimestampStyles.RelativeTime)}.`);
		}

		const newCooldown = new Date(now + Time.Day);
		await this.container.prisma.user.update({
			where: { id: giver.id },
			data: { reputationCooldown: newCooldown },
		});
		await this.container.prisma.user.update({
			where: { id: target.id },
			data: { reputation: target.reputation + 1 },
		});

		const embed = new EmbedBuilder().setDescription(`You have given a reputation point to ${user}`);
		return interaction.editReply({ embeds: [embed] });
	}

	public async chatInputCheck(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const result = await Result.fromAsync(() => getUser(interaction.user.id));
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();

		const description = [
			`Reputation points: ${inlineCode(data.reputation.toString())}`,
			`Cooldown: ${time(data.reputationCooldown, TimestampStyles.RelativeTime)}`,
		];
		const embed = new EmbedBuilder().setDescription(description.join('\n'));

		return interaction.editReply({ embeds: [embed] });
	}
}
