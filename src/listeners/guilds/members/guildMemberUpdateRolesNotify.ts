import { type Guild as PrismaGuild } from '@prisma/client';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener, Result } from '@sapphire/framework';
import { type Role, type GuildMember, EmbedBuilder } from 'discord.js';
import { getGuild } from '#lib/database';
import { Colors } from '#util/constants';
import { getTag } from '#util/discord-utilities';

export class GuildMemberUpdateRoleNotifyListener extends Listener<typeof Events.GuildMemberUpdate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.GuildMemberUpdate,
		});
	}

	public async run(previous: GuildMember, next: GuildMember) {
		const result = await Result.fromAsync(async () => getGuild(next.guild.id));

		await result.match({
			ok: async data => this.handleOk(previous, next, data),
			err: async error => this.handleErr(error),
		});
	}

	private async handleOk(previous: GuildMember, next: GuildMember, { logChannelId }: PrismaGuild) {
		if (!logChannelId) return;

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
