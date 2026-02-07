import { Result, type ApplicationCommandRegistry } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { bold } from 'discord.js';
import { Events } from '#lib/types';
import { getInventory } from '#lib/util/functions/inventoryHelper';
import { formatMoney } from '#util/common';

export class ItemCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'A command to interact with items.',
			subcommands: [
				{ name: 'use', chatInputRun: 'chatInputUse' },
				{ name: 'sell', chatInputRun: 'chatInputSell' },
			],
		});
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand(command =>
					command
						.setName('use')
						.setDescription('Use an Item')
						.addStringOption(option =>
							option
								.setName('item')
								.setDescription('Item to use')
								.setRequired(true)
								.setAutocomplete(true),
						)
						.addIntegerOption(option => option.setName('amount').setDescription('Amount of items to use')),
				)
				.addSubcommand(command =>
					command
						.setName('sell')
						.setDescription('Sell an Item')
						.addStringOption(option =>
							option
								.setName('item')
								.setDescription('Item to sell')
								.setRequired(true)
								.setAutocomplete(true),
						)
						.addIntegerOption(option => option.setName('amount').setDescription('Amount of items to sell')),
				),
		);
	}

	public async chatInputUse(interaction: Subcommand.ChatInputCommandInteraction) {
		const item = interaction.options.getString('item', true);
		const amount = interaction.options.getInteger('amount', false) ?? 1;

		this.container.client.emit(Events.ItemRequestReceived, item, amount, interaction);
	}

	public async chatInputSell(interaction: Subcommand.ChatInputCommandInteraction) {
		const itemName = interaction.options.getString('item', true);
		const amount = interaction.options.getInteger('amount', false) ?? 1;
		const items = this.container.stores.get('items');
		const item = items.get(itemName);
		if (!item) {
			this.container.client.emit(Events.UnknownItem, { interaction, context: { itemName, amount } });
			return;
		}

		await interaction.deferReply();

		const result = await Result.fromAsync(() => getInventory(interaction.user.id));
		if (result.isErr()) throw result.unwrapErr();

		const dataResult = result.unwrap();
		if (dataResult.isNone()) return interaction.editReply('You do not have any items.');
		const inventory = dataResult.unwrap();
		const inventoryItem = inventory.get(item.name);
		if (!inventoryItem || inventoryItem < amount) {
			return interaction.editReply('You do not have enough of that item to sell.');
		}

		await this.container.prisma.inventory.update({
			where: { userId_itemId: { userId: interaction.user.id, itemId: item.name } },
			data: { quantity: { decrement: amount } },
		});

		await this.container.prisma.user.update({
			where: { id: interaction.user.id },
			data: { wallet: { increment: item.sellPrice * amount } },
		});

		this.container.analytics.recordItem({
			userId: interaction.user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			itemId: item.name,
			action: 'SELL',
			quantity: amount,
		});

		this.container.analytics.recordMoney({
			userId: interaction.user.id,
			guildId: interaction.guildId ?? 'none',
			channelId: interaction.channelId,
			command: interaction.commandName,
			reason: 'STORE',
			amount: item.sellPrice * amount,
			earned: true,
		});

		return interaction.editReply(
			`You have sold ${amount} ${item.iconEmoji} ${bold(item.displayName)} for ${formatMoney(item.sellPrice * amount)}.`,
		);
	}
}
