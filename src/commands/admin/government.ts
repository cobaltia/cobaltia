import { Subcommand } from '@sapphire/plugin-subcommands';
import { Result } from '@sapphire/result';
import { EmbedBuilder } from 'discord.js';
import { getClient } from '#lib/database';

export class GovernmentCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'Government related commands.',
			preconditions: ['GuildOnly', 'CobaltOnly', 'OwnerOnly'],
			subcommands: [
				{
					name: 'add',
					type: 'group',
					entries: [
						{ name: 'executive', chatInputRun: 'ChatInputAddExecutive' },
						{ name: 'minister', chatInputRun: 'ChatInputAddMinister' },
					],
				},
				{
					name: 'remove',
					type: 'group',
					entries: [
						{ name: 'executive', chatInputRun: 'ChatInputRemoveExecutive' },
						{ name: 'minister', chatInputRun: 'ChatInputRemoveMinister' },
					],
				},
				{ name: 'list', chatInputRun: 'ChatInputList' },
			],
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setDefaultMemberPermissions(0)
				.addSubcommandGroup(group =>
					group
						.setName('add')
						.setDescription('Add government roles.')
						.addSubcommand(command =>
							command
								.setName('executive')
								.setDescription('Add user to the executive group.')
								.addUserOption(option =>
									option.setName('user').setDescription('The user to add to the executive group').setRequired(true),
								),
						)
						.addSubcommand(command =>
							command
								.setName('minister')
								.setDescription('Add user to the minister group.')
								.addUserOption(option =>
									option.setName('user').setDescription('The user to add to the minister group').setRequired(true),
								),
						),
				)
				.addSubcommandGroup(group =>
					group
						.setName('remove')
						.setDescription('Remove government roles.')
						.addSubcommand(command =>
							command
								.setName('executive')
								.setDescription('Remove user from the executive group')
								.addUserOption(option =>
									option
										.setName('user')
										.setDescription('The user to remove from the executive group')
										.setRequired(true),
								),
						)
						.addSubcommand(command =>
							command
								.setName('minister')
								.setDescription('Remove user from the minister group')
								.addUserOption(option =>
									option.setName('user').setDescription('The user to remove from the minister group').setRequired(true),
								),
						),
				)
				.addSubcommand(command => command.setName('list').setDescription('List government members')),
		);
	}

	public async ChatInputAddExecutive(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		const user = interaction.options.getUser('user', true);

		const result = await Result.fromAsync(async () =>
			this.container.prisma.client.findUniqueOrThrow({ where: { id: this.container.client.id! } }),
		);

		if (result.isErr()) throw result.unwrapErr();
		const clientData = result.unwrap();
		const checkExecutive = clientData.executives.find(id => id === user.id);

		if (checkExecutive) return interaction.editReply(`${user.tag} is already an executive.`);

		await this.container.prisma.client.update({
			where: { id: this.container.client.id! },
			data: {
				executives: { push: user.id },
			},
		});

		await interaction.editReply(`Added ${user.tag} to the executive group.`);
	}

	public async ChatInputAddMinister(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		const user = interaction.options.getUser('user', true);

		const result = await Result.fromAsync(async () =>
			this.container.prisma.client.findUniqueOrThrow({ where: { id: this.container.client.id! } }),
		);

		if (result.isErr()) throw result.unwrapErr();
		const clientData = result.unwrap();
		const checkMinister = clientData.ministers.find(id => id === user.id);

		if (checkMinister) return interaction.editReply(`${user.tag} is already a minister.`);

		await this.container.prisma.client.update({
			where: { id: this.container.client.id! },
			data: {
				ministers: { push: user.id },
			},
		});

		await interaction.editReply(`Added ${user.tag} to the minister group.`);
	}

	public async ChatInputRemoveExecutive(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		const user = interaction.options.getUser('user', true);

		const result = await Result.fromAsync(async () =>
			this.container.prisma.client.findUniqueOrThrow({ where: { id: this.container.client.id! } }),
		);

		if (result.isErr()) throw result.unwrapErr();
		const clientData = result.unwrap();
		const checkExecutive = clientData.executives.find(id => id === user.id);

		if (!checkExecutive) return interaction.editReply(`${user.tag} is not an executive.`);

		const updatedExecutives = clientData.executives.filter(id => id !== user.id);

		await this.container.prisma.client.update({
			where: { id: this.container.client.id! },
			data: {
				executives: { set: updatedExecutives },
			},
		});

		await interaction.editReply(`Removed ${user.tag} from the executive group.`);
	}

	public async ChatInputRemoveMinister(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		const user = interaction.options.getUser('user', true);

		const result = await Result.fromAsync(async () => getClient(this.container.client.id!));

		if (result.isErr()) throw result.unwrapErr();
		const clientData = result.unwrap();
		const checkMinister = clientData.ministers.find(id => id === user.id);

		if (!checkMinister) return interaction.editReply(`${user.tag} is not a minister.`);

		const updatedMinisters = clientData.ministers.filter(id => id !== user.id);

		await this.container.prisma.client.update({
			where: { id: this.container.client.id! },
			data: {
				ministers: { set: updatedMinisters },
			},
		});

		await interaction.editReply(`Removed ${user.tag} from the minister group.`);
	}

	public async ChatInputList(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply();

		const result = await Result.fromAsync(async () => getClient(this.container.client.id!));
		if (result.isErr()) throw result.unwrapErr();
		const clientData = result.unwrap();

		const executiveMap = clientData.executives.map(id => `<@${id}>`).join('\n') || 'No executives found.';
		const ministerMap = clientData.ministers.map(id => `<@${id}>`).join('\n') || 'No ministers found.';

		const embed = new EmbedBuilder().setTitle('Government Members').setFields(
			{ name: 'Executives', value: executiveMap, inline: true },
			{
				name: 'Ministers',
				value: ministerMap,
				inline: true,
			},
		);

		await interaction.editReply({ embeds: [embed] });
	}
}
