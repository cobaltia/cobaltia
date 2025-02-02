import { AliasPiece } from '@sapphire/framework';
import { type Awaitable, roundNumber } from '@sapphire/utilities';
import { type ChatInputCommandInteraction } from 'discord.js';
import { type ItemPayload } from '#lib/types';

export class Item<Options extends Item.Options = Item.Options> extends AliasPiece<ItemOptions, 'items'> {
	public readonly collectible: boolean;

	public readonly description: string;

	public readonly price: number;

	public readonly sellPrice: number;

	public readonly icon: string;

	public constructor(context: Item.LoaderContext, options: ItemOptions) {
		super(context, options);

		this.collectible = options.collectible ?? false;
		this.description = options.description ?? this.name;
		this.icon = options.icon ?? '';
		this.price = options.price ?? 1;
		this.sellPrice = options.sellPrice ?? roundNumber(this.price * 0.7, 2);
	}

	public run?(interaction: ChatInputCommandInteraction, payload: ItemPayload): Awaitable<unknown>;

	public override toJSON(): ItemJSON {
		return {
			...super.toJSON(),
			collectible: this.collectible,
			description: this.description,
			icon: this.icon,
			price: this.price,
			sellPrice: this.sellPrice,
		};
	}
}

export interface ItemOptions extends AliasPiece.Options {
	collectible?: boolean;
	description?: string;
	icon?: string;
	price?: number;
	sellPrice?: number;
}

export interface ItemJSON extends AliasPiece.JSON {
	collectible: boolean;
	description: string;
	icon: string;
	price: number;
	sellPrice: number;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Item {
	export type Options = ItemOptions;
	export type JSON = ItemJSON;
	export type LoaderContext = AliasPiece.LoaderContext<'items'>;
}
