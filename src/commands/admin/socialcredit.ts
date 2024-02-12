import { Result, UserError } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getUser } from '#lib/database';

export class SocialCreditCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'Social Credit System',
			requiredUserPermissions: [PermissionFlagsBits.ManageGuild],
			subcommands: [
				{ name: 'add', chatInputRun: 'chatInputAdd' },
				{ name: 'remove', chatInputRun: 'chatInputRemove' },
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
						.setName('add')
						.setDescription('Add social credit to a user.')
						.addUserOption(option =>
							option
								.setName('user')
								.setDescription('The user to add social credit to.')
								.setRequired(true),
						)
						.addIntegerOption(option =>
							option
								.setName('amount')
								.setDescription('The amount of social credit to add.')
								.setRequired(true)
								.setMinValue(0)
								.setMaxValue(2_000),
						),
				)
				.addSubcommand(command =>
					command
						.setName('remove')
						.setDescription('Remove social credit from a user.')
						.addUserOption(option =>
							option
								.setName('user')
								.setDescription('The user to remove social credit from.')
								.setRequired(true),
						)
						.addIntegerOption(option =>
							option
								.setName('amount')
								.setDescription('The amount of social credit to remove.')
								.setRequired(true)
								.setMinValue(0)
								.setMaxValue(2_000),
						),
				),
		);
	}

	public async chatInputAdd(interaction: Subcommand.ChatInputCommandInteraction) {
		const user = interaction.options.getUser('user', true);
		const amount = interaction.options.getInteger('amount', true);
		await interaction.deferReply();

		const result = await Result.fromAsync(async () => getUser(user.id));
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const newAmount = data.socialCredit + amount;
		if (newAmount > 2_000)
			throw new UserError({
				identifier: 'SocialCreditAddTooMuch',
				message: 'You cannot add more than 2000 social credit.',
			});

		await this.container.prisma.user.update({
			where: { id: user.id },
			data: { socialCredit: newAmount },
		});

		const embed = new EmbedBuilder().setDescription(`Added ${amount} social credit to ${user}`);
		await interaction.editReply({ embeds: [embed] });
	}

	public async chatInputRemove(interaction: Subcommand.ChatInputCommandInteraction) {
		const user = interaction.options.getUser('user', true);
		const amount = interaction.options.getInteger('amount', true);
		await interaction.deferReply();

		const result = await Result.fromAsync(async () => getUser(user.id));
		if (result.isErr()) throw result.unwrapErr();

		const data = result.unwrap();
		const newAmount = data.socialCredit - amount;
		if (newAmount < 0)
			throw new UserError({
				identifier: 'SocialCreditRemoveTooMuch',
				message: 'You cannot remove more social credit than the user has.',
			});

		await this.container.prisma.user.update({
			where: { id: user.id },
			data: { socialCredit: newAmount },
		});

		const embed = new EmbedBuilder().setDescription(`Removed ${amount} social credit from ${user}`);
		await interaction.editReply({ embeds: [embed] });
	}
}
