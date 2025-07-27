import type { $Enums } from '@prisma/client';
import { type ChatInputCommandInteraction, type GuildMember, type Message } from 'discord.js';
import type { Item } from '#lib/structures/Item';

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
	ItemRequestReceived: 'itemRequestReceived' as const,
	UnknownItem: 'unknownItem' as const,
	ItemDenied: 'itemDenied' as const,
	ItemAccepted: 'itemAccepted' as const,
	ItemError: 'itemError' as const,
	ItemRun: 'itemRun' as const,
	ItemRunSuccess: 'itemRunSuccess' as const,
};

declare const CobaltEvents: typeof Events;

export interface ItemContext extends Record<PropertyKey, unknown> {
	amount: number;
	itemName: string;
}

export interface ItemPayload {
	context: ItemContext;
	interaction: ChatInputCommandInteraction;
	item: Item;
}

export interface UnknownItemPayload {
	context: ItemContext;
	interaction: ChatInputCommandInteraction;
}

export interface ErrorItemPayload extends ItemPayload {
	duration: number;
}

export interface RunItemPayload extends ItemPayload {
	duration: number;
}

export interface RunSuccessItemPayload extends RunItemPayload {
	duration: number;
}

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
			transactionType: $Enums.Transaction,
			description: string[],
		];
		[CobaltEvents.BankDepositTransaction]: [user: User, amount: number, description: string[]];
		[CobaltEvents.BankWithdrawTransaction]: [user: User, amount: number, description: string[]];
		[CobaltEvents.BankTransferTransaction]: [user: User, receiver: User, amount: number, description: string[]];
		[CobaltEvents.ItemRequestReceived]: [
			itemName: string,
			amount: number,
			interaction: ChatInputCommandInteraction,
		];
		[CobaltEvents.UnknownItem]: [payload: UnknownItemPayload];
		[CobaltEvents.ItemDenied]: [error: string, payload: ItemPayload];
		[CobaltEvents.ItemAccepted]: [payload: ItemPayload];
		[CobaltEvents.ItemError]: [error: unknown, payload: ErrorItemPayload];
		[CobaltEvents.ItemRun]: [payload: RunItemPayload];
		[CobaltEvents.ItemRunSuccess]: [payload: RunSuccessItemPayload];
	}
}
