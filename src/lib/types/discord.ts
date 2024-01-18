import type { GuildMember, Message } from 'discord.js';

export type GuildMessage = Message<true> & { member: GuildMember };

export const Events = {
	VoiceChannelJoin: 'voiceChannelJoin' as const,
	VoiceChannelLeave: 'voiceChannelLeave' as const,
	VoiceChannelSwitch: 'voiceChannelSwitch' as const,
	VoiceMute: 'voiceMute' as const,
	VoiceUnmute: 'voiceUnmute' as const,
	VoiceDeaf: 'voiceDeaf' as const,
	VoiceUndeaf: 'voiceUndeaf' as const,
	VoiceStreamStart: 'voiceStreamStart' as const,
	VoiceStreamStop: 'voiceStreamStop' as const,
};

declare const CobaltEvents: typeof Events;

declare module 'discord.js' {
	interface ClientEvents {
		[CobaltEvents.VoiceChannelJoin]: [member: GuildMember, next: VoiceState];
		[CobaltEvents.VoiceChannelLeave]: [member: GuildMember, previous: VoiceState, data: string | null];
		[CobaltEvents.VoiceChannelSwitch]: [previous: VoiceState, next: VoiceState];
		[CobaltEvents.VoiceMute]: [member: GuildMember, next: VoiceState];
		[CobaltEvents.VoiceUnmute]: [member: GuildMember, previous: VoiceState];
		[CobaltEvents.VoiceDeaf]: [member: GuildMember, next: VoiceState];
		[CobaltEvents.VoiceUndeaf]: [member: GuildMember, previous: VoiceState];
		[CobaltEvents.VoiceStreamStart]: [member: GuildMember, next: VoiceState];
		[CobaltEvents.VoiceStreamStop]: [member: GuildMember, previous: VoiceState];
	}
}
