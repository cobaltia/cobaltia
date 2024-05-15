import type { $Enums } from '@prisma/client';
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
	RawBankTransaction: 'rawBankTransaction' as const,
	BankDepositTransaction: 'bankDepositTransaction' as const,
	BankWithdrawTransaction: 'bankWithdrawTransaction' as const,
	BankTransferTransaction: 'bankTransferTransaction' as const,
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
		[CobaltEvents.RawBankTransaction]: [
			user: User,
			receiver: User | null,
			amount: number,
			type: $Enums.Transaction,
			description: string[],
		];
		[CobaltEvents.BankDepositTransaction]: [user: User, amount: number, description: string[]];
		[CobaltEvents.BankWithdrawTransaction]: [user: User, amount: number, description: string[]];
		[CobaltEvents.BankTransferTransaction]: [user: User, receiver: User, amount: number, description: string[]];
	}
}
