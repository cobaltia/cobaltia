import { Events, Listener } from '@sapphire/framework';
import { type VoiceState } from 'discord.js';
import { Events as CobaltEvents } from '#lib/types/discord';

export class RawVoiceStateUpdate extends Listener<typeof Events.VoiceStateUpdate> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.VoiceStateUpdate,
		});
	}

	public async run(previous: VoiceState, next: VoiceState) {
		if (!next.member || next.member.user.bot) return;
		const { redis } = this.container;
		const member = next.member;

		if (!previous.channelId && next.channelId) {
			const start = Date.now();
			await redis.set(`voice:${next.member.id}`, start);
			this.container.client.emit(CobaltEvents.VoiceChannelJoin, member, next);
		}

		if (previous.channelId && !next.channelId) {
			const start = await redis.get(`voice:${next.member.id}`);
			this.container.client.emit(CobaltEvents.VoiceChannelLeave, member, previous, start);
			await redis.del(`voice:${next.member.id}`);
		}

		if (previous.channelId && next.channelId && previous.channelId !== next.channelId) {
			this.container.client.emit(CobaltEvents.VoiceChannelSwitch, previous, next);
		}

		if (!previous.mute && next.mute) {
			this.container.client.emit(CobaltEvents.VoiceMute, member, next);
		}

		if (previous.mute && !next.mute) {
			this.container.client.emit(CobaltEvents.VoiceUnmute, member, previous);
		}

		if (!previous.deaf && next.deaf) {
			this.container.client.emit(CobaltEvents.VoiceDeaf, member, next);
		}

		if (previous.deaf && !next.deaf) {
			this.container.client.emit(CobaltEvents.VoiceUndeaf, member, previous);
		}

		if (!previous.streaming && next.streaming) {
			this.container.client.emit(CobaltEvents.VoiceStreamStart, member, next);
		}

		if (previous.streaming && !next.streaming) {
			this.container.client.emit(CobaltEvents.VoiceStreamStop, member, previous);
		}
	}
}
