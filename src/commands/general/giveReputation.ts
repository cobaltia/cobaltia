import { Command, Result, UserError } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { ApplicationCommandType, EmbedBuilder, TimestampStyles, time } from 'discord.js';
import { getUser } from '#lib/database';

export class GiveReputationCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Give reputation to another user.',
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerContextMenuCommand(builder =>
			builder.setName('Give Reputation').setType(ApplicationCommandType.User),
		);
	}

	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		if (interaction.targetId === interaction.user.id) {
			throw new UserError({
				identifier: 'reputationGiveSelf',
				message: 'You cannot give reputation to yourself.',
			});
		}

		await interaction.deferReply();
		const user = await this.container.client.users.fetch(interaction.targetId);

		const giveResult = await Result.fromAsync(() => getUser(interaction.user.id));
		if (giveResult.isErr()) throw giveResult.unwrapErr();

		const targetResult = await Result.fromAsync(() => getUser(user.id));
		if (targetResult.isErr()) throw targetResult.unwrapErr();

		const giver = giveResult.unwrap();
		const target = targetResult.unwrap();

		const cooldown = giver.reputationCooldown.getTime();
		const now = Date.now();
		if (cooldown > now) {
			return interaction.followUp(
				`You can give reputation again in ${time(cooldown, TimestampStyles.RelativeTime)}.`,
			);
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
}
