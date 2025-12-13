import { AliasPiece } from '@sapphire/framework';
import { type Awaitable, roundNumber } from '@sapphire/utilities';
import { type ChatInputCommandInteraction } from 'discord.js';
import { type ItemPayload } from '#lib/types';
import { ItemEmojis } from '#lib/util/constants';

export class Item<Options extends Item.Options = Item.Options> extends AliasPiece<ItemOptions, 'items'> {
	public readonly displayName: string;

	public readonly collectible: boolean;

	public readonly description: string;

	public readonly price: number;

	public readonly sellPrice: number;

	public readonly icon: ItemEmojis;

	public constructor(context: Item.LoaderContext, options: ItemOptions) {
		super(context, options);

		this.displayName = options.displayName ?? this.name;
		this.collectible = options.collectible ?? false;
		this.description = options.description;
		this.icon = options.icon ?? ItemEmojis.Default;
		this.price = options.price ?? 1;
		this.sellPrice = options.sellPrice ?? roundNumber(this.price * 0.7, 2);
	}

	public run?(interaction: ChatInputCommandInteraction, payload: ItemPayload): Awaitable<unknown>;

	public get iconEmoji() {
		const cache = this.container.client.application?.emojis.cache;
		return cache?.find(emoji => emoji.name === this.icon) ?? this.icon;
	}

	public override toJSON(): ItemJSON {
		return {
			...super.toJSON(),
			collectible: this.collectible,
			description: this.description,
			icon: this.icon,
			displayName: this.displayName,
			price: this.price,
			sellPrice: this.sellPrice,
		};
	}
}

export interface ItemOptions extends AliasPiece.Options {
	collectible?: boolean;
	description: string;
	displayName?: string;
	icon?: ItemEmojis;
	price?: number;
	sellPrice?: number;
}

export interface ItemJSON extends AliasPiece.JSON {
	collectible: boolean;
	description: string;
	displayName: string;
	icon: ItemEmojis;
	price: number;
	sellPrice: number;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Item {
	export type Options = ItemOptions;
	export type JSON = ItemJSON;
	export type LoaderContext = AliasPiece.LoaderContext<'items'>;
}
