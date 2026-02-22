import { type ChatInputCommandInteraction, type GuildMember, type Message } from 'discord.js';
import type { Event } from '#lib/structures/Event';
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
	ItemRequestReceived: 'itemRequestReceived' as const,
	UnknownItem: 'unknownItem' as const,
	ItemDenied: 'itemDenied' as const,
	ItemAccepted: 'itemAccepted' as const,
	ItemError: 'itemError' as const,
	ItemRun: 'itemRun' as const,
	ItemRunSuccess: 'itemRunSuccess' as const,
	EventRequestReceived: 'eventRequestReceived' as const,
	UnknownEvent: 'unknownEvent' as const,
	EventDenied: 'eventDenied' as const,
	EventAccepted: 'eventAccepted' as const,
	EventError: 'eventError' as const,
	EventRun: 'eventRun' as const,
	EventRunSuccess: 'eventRunSuccess' as const,
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

export interface EventContext extends Record<PropertyKey, unknown> {
	eventName: string;
}

export interface EventPayload {
	context: EventContext;
	event: Event;
	interaction: ChatInputCommandInteraction;
}

export interface UnknownEventPayload {
	context: EventContext;
	interaction: ChatInputCommandInteraction;
}

export interface ErrorEventPayload extends EventPayload {
	duration: number;
}

export interface RunEventPayload extends EventPayload {
	duration: number;
}

export interface RunSuccessEventPayload extends RunEventPayload {
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
		[CobaltEvents.EventRequestReceived]: [eventName: string, interaction: ChatInputCommandInteraction];
		[CobaltEvents.UnknownEvent]: [payload: UnknownEventPayload];
		[CobaltEvents.EventDenied]: [error: string, payload: EventPayload];
		[CobaltEvents.EventAccepted]: [payload: EventPayload];
		[CobaltEvents.EventError]: [error: unknown, payload: ErrorEventPayload];
		[CobaltEvents.EventRun]: [payload: RunEventPayload];
		[CobaltEvents.EventRunSuccess]: [payload: RunSuccessEventPayload];
	}
}
