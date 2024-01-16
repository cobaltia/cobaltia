import { Prisma, type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import { type Role, type GuildMember, EmbedBuilder } from 'discord.js';
import { Colors } from '#lib/util/constants';
import { getTag } from '#lib/util/util';

export class GuildMemberUpdateRoleNotify extends Listener<typeof Events.GuildMemberUpdate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildMemberUpdate,
		});
	}

	public async run(previous: GuildMember, next: GuildMember) {
		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.findUniqueOrThrow({ where: { id: next.guild.id } }),
		);

		await result.match({
			ok: async data => this.handleOk(previous, next, data),
			err: async error => this.handleDbErr(error, previous, next),
		});
	}

	private async handleOk(previous: GuildMember, next: GuildMember, { logChannelId }: PrismaGuild) {
		if (!logChannelId) return this.handleErr(new Error(`Could not fine log channel set for ${next.guild.name}`));

		const prevRoles = previous.roles.cache;
		const nextRoles = next.roles.cache;
		if (prevRoles.equals(nextRoles)) return;

		const addedRoles: Role[] = [];
		const removedRoles: Role[] = [];

		// Check for added roles
		for (const [key, role] of nextRoles.entries()) {
			if (!prevRoles.has(key)) addedRoles.push(role);
		}

		// Check for removed roles
		for (const [key, role] of prevRoles.entries()) {
			if (!nextRoles.has(key)) removedRoles.push(role);
		}

		const channel = next.guild.channels.cache.get(logChannelId);
		if (!isTextBasedChannel(channel)) return this.handleErr(new Error('Log channel is not a text channel'));

		return channel.send({ embeds: [this.buildEmbed(next, addedRoles, removedRoles)] });
	}

	private async handleDbErr(error: unknown, previous: GuildMember, next: GuildMember) {
		if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'))
			return this.handleErr(error);

		const result = await Result.fromAsync(async () =>
			this.container.prisma.guild.create({ data: { id: next.guild.id } }),
		);

		await result.match({
			ok: async data => this.handleOk(previous, next, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleErr(error: unknown) {
		this.container.logger.error(error);
	}

	private buildEmbed(member: GuildMember, addedRoles: Role[], removedRoles: Role[]) {
		const icon = member.user.displayAvatarURL({ extension: 'png', forceStatic: false });
		return new EmbedBuilder()
			.setAuthor({ name: getTag(member.user), iconURL: icon })
			.setTitle('Member Roles Updated')
			.setDescription(this.buildDescription(addedRoles, removedRoles))
			.setFooter({ text: `User ID: ${member.id}` })
			.setColor(Colors.Blue)
			.setTimestamp();
	}

	private buildDescription(addedRoles: Role[], removedRoles: Role[]) {
		const description = [];
		if (addedRoles.length) description.push(`Role(s) added: ${addedRoles.join(', ')}`);
		if (removedRoles.length) description.push(`Role(s) removed: ${removedRoles.join(', ')}`);
		return description.join('\n');
	}
}
