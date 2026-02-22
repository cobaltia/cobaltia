import type { User as PrismaUser } from '@prisma/client';
import { Command, Result, UserError } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { ApplicationCommandType, EmbedBuilder, type User } from 'discord.js';
import { getUser } from '#lib/database';
import { formatMoney, pickWeightedRandom } from '#util/common';

const weights = [52, 18, 10, 12, 8];

export class RobCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Rob another user.',
			cooldownDelay: 15 * Time.Second,
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addUserOption(option => option.setName('user').setDescription('The user to rob.').setRequired(true)),
		);

		registry.registerContextMenuCommand(builder => builder.setName('Rob').setType(ApplicationCommandType.User));
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const user = interaction.options.getUser('user', true);
		if (user.id === interaction.user.id) {
			throw new UserError({ identifier: 'SelfRob', message: 'You cannot rob yourself.' });
		}

		await interaction.deferReply();
		const victimResult = await Result.fromAsync(() => getUser(user.id));

		await victimResult.match({
			ok: async data => this.handleOk(interaction, data, user),
			err: async error => {
				throw error;
			},
		});
	}

	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		if (interaction.targetId === interaction.user.id) {
			throw new UserError({ identifier: 'SelfRob', message: 'You cannot rob yourself.' });
		}

		await interaction.deferReply();
		const user = await this.container.client.users.fetch(interaction.targetId);
		const victimResult = await Result.fromAsync(() => getUser(user.id));

		await victimResult.match({
			ok: async data => this.handleOk(interaction, data, user),
			err: async error => {
				throw error;
			},
		});
	}

	private async handleOk(
		interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction,
		victim: PrismaUser,
		user: User,
	) {
		if (victim.wallet.lessThanOrEqualTo(0)) {
			throw new UserError({ identifier: 'NoMoney', message: 'You cannot rob someone with no money.' });
		}

		const amount = Math.floor(Math.random() * victim.wallet.toNumber());
		const bounty = Math.floor(amount * 0.2);

		const embed = new EmbedBuilder();

		const situation = pickWeightedRandom(weights);
		switch (situation) {
			case 0:
				embed.setDescription(await this.robSuccess(interaction, user, amount, bounty));
				break;
			case 1:
				embed.setDescription(await this.robFail(user));
				break;
			case 2:
				embed.setDescription(await this.robKilled(interaction, user));
				break;
			case 3:
				embed.setDescription(await this.robCaught(interaction));
				break;
			case 4:
				embed.setDescription(await this.robReverse(interaction, user));
				break;
		}

		await interaction.editReply({ embeds: [embed] });
	}

	private async robSuccess(
		interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction,
		victim: User,
		amount: number,
		bounty: number,
	) {
		await this.container.prisma.user.update({
			where: { id: victim.id },
			data: { wallet: { decrement: amount } },
		});
		const next = await this.container.prisma.user.update({
			where: { id: interaction.user.id },
			data: { wallet: { increment: amount }, bounty: { increment: bounty } },
		});

		this.container.analytics.recordMoney({
			userId: interaction.user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: interaction.commandName,
			reason: 'ROB',
			amount,
			type: 'EARNED',
		});

		this.container.analytics.recordMoney({
			userId: victim.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: interaction.commandName,
			reason: 'ROB',
			amount,
			type: 'LOST',
		});

		const message = [
			`You successfully robbed ${victim} and got away with ${formatMoney(amount)}.`,
			`You now have a bounty of ${formatMoney(next.bounty)}.`,
		];

		return message.join('\n');
	}

	private async robFail(victim: User) {
		return `${victim} fought back and you had to run away. You didn't get anything.`;
	}

	private async robKilled(
		interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction,
		victim: User,
	) {
		const robberResult = await Result.fromAsync(() => getUser(interaction.user.id));
		if (robberResult.isErr()) throw robberResult.unwrapErr();
		const robber = robberResult.unwrap();

		await this.container.prisma.user.update({
			where: { id: victim.id },
			data: { bankBalance: { increment: robber.bounty } },
		});

		await this.container.prisma.user.update({
			where: { id: interaction.user.id },
			data: { wallet: robber.wallet.lessThan(0) ? robber.wallet : 0, bounty: 0 },
		});

		this.container.analytics.recordMoney({
			userId: victim.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: interaction.commandName,
			reason: 'BOUNTY_CLAIM',
			amount: robber.bounty.toNumber(),
			type: 'EARNED',
		});

		this.container.analytics.recordMoney({
			userId: robber.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: interaction.commandName,
			reason: 'DEATH',
			amount: robber.wallet.lessThan(0) ? robber.wallet.toNumber() : 0,
			type: 'LOST',
		});

		return `You tried to rob ${victim} but they fought back and killed you. They claimed your bounty of ${formatMoney(
			robber.bounty,
		)}. You lost all your money.`;
	}

	private async robCaught(interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction) {
		const robberResult = await Result.fromAsync(() => getUser(interaction.user.id));
		if (robberResult.isErr()) throw robberResult.unwrapErr();
		const robber = robberResult.unwrap();

		const fine = Math.floor(robber.bounty.mul(0.2).toNumber());
		await this.container.prisma.user.update({
			where: { id: interaction.user.id },
			data: { wallet: { decrement: fine }, bounty: 0 },
		});

		this.container.analytics.recordMoney({
			userId: interaction.user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: interaction.commandName,
			reason: 'DEATH',
			amount: fine,
			type: 'LOST',
		});

		return `You were caught by the police and had to pay a fine of ${formatMoney(
			fine,
		)}. Your bounty has been reset to 0.`;
	}

	private async robReverse(
		interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction,
		victim: User,
	) {
		const robberResult = await Result.fromAsync(() => getUser(interaction.user.id));
		if (robberResult.isErr()) throw robberResult.unwrapErr();
		const robber = robberResult.unwrap();

		await this.container.prisma.user.update({
			where: { id: victim.id },
			data: { wallet: { increment: robber.wallet } },
		});
		await this.container.prisma.user.update({
			where: { id: interaction.user.id },
			data: { wallet: 0 },
		});

		this.container.analytics.recordMoney({
			userId: interaction.user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: interaction.commandName,
			reason: 'ROB',
			amount: robber.wallet.toNumber(),
			type: 'LOST',
		});

		this.container.analytics.recordMoney({
			userId: victim.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: interaction.commandName,
			reason: 'ROB',
			amount: robber.wallet.toNumber(),
			type: 'EARNED',
		});

		return `${victim} took advantage of your attempt to rob them and took all your money. You lost all your money.`;
	}
}
