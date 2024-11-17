import { AliasPiece } from '@sapphire/framework';
import { Awaitable, roundNumber } from '@sapphire/utilities';
import { type ChatInputCommandInteraction } from 'discord.js';

export class Item<Options extends Item.Options = Item.Options> extends AliasPiece<ItemOptions, 'items'> {
	public readonly collectible: boolean;

	public readonly description: string;

	public readonly price: number;

	public readonly sellPrice: number;

	public constructor(context: Item.LoaderContext, options: ItemOptions) {
		super(context, options);

		this.collectible = options.collectible ?? false;
		this.description = options.description ?? this.name;
		this.price = options.price ?? 1;
		this.sellPrice = roundNumber(this.price * 0.7, 2);
	}

	public run?(interaction: ChatInputCommandInteraction): Awaitable<unknown>;

	public override toJSON(): ItemJSON {
		return {
			...super.toJSON(),
			collectible: this.collectible,
			description: this.description,
			price: this.price,
			sellPrice: this.sellPrice,
		};
	}
}

export interface ItemOptions extends AliasPiece.Options {
	collectible?: boolean;
	description?: string;
	price?: number;
	sellPrice?: number;
}

export interface ItemJSON extends AliasPiece.JSON {
	collectible: boolean;
	description: string;
	price: number;
	sellPrice: number;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Item {
	export type Options = ItemOptions;
	export type JSON = ItemJSON;
	export type LoaderContext = AliasPiece.LoaderContext<'items'>;
}
