import { Piece } from '@sapphire/framework';
import { type Awaitable } from '@sapphire/utilities';
import { type ChatInputCommandInteraction } from 'discord.js';

export class Event<Options extends Event.Options = Event.Options> extends Piece<EventOptions, 'events'> {
	public constructor(context: Event.LoaderContext, options: EventOptions) {
		super(context, options);
	}

	public run?(interaction: ChatInputCommandInteraction): Awaitable<unknown>;

	public override toJSON(): EventJSON {
		return {
			...super.toJSON(),
		};
	}
}

export interface EventOptions extends Piece.Options {}

export interface EventJSON extends Piece.JSON {}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Event {
	export type Options = EventOptions;
	export type JSON = EventJSON;
	export type LoaderContext = Piece.LoaderContext<'events'>;
}
