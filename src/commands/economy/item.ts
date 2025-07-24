import { Result, type ApplicationCommandRegistry } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { getInventory } from '#lib/database';
import { Events } from '#lib/types';
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

		this.container.client.emit(Events.PossibleItem, item, amount, interaction);
	}

	public async chatInputSell(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const itemName = interaction.options.getString('item', true);
		const amount = interaction.options.getInteger('amount', false) ?? 1;
		const items = this.container.stores.get('items');
		const item = items.get(itemName);
		// TODO(Isidro): Maybe make is the unknown item listener
		if (!item) throw new Error('Item not found');

		const result = await Result.fromAsync(() => getInventory(interaction.user.id));
		if (result.isErr()) throw result.unwrapErr();

		const inventory = result.unwrap();
		const inventoryMap = new Map(Object.entries(inventory));
		const inventoryItem = inventoryMap.get(item.id) as number;
		if (inventoryItem < amount) {
			return interaction.editReply('You do not have enough of that item to sell.');
		}

		await this.container.prisma.inventory.update({
			where: { id: interaction.user.id },
			data: { [item.id]: { decrement: amount } },
		});

		await this.container.prisma.user.update({
			where: { id: interaction.user.id },
			data: { wallet: { increment: item.sellPrice * amount } },
		});

		this.container.metrics.incrementItemLost({
			item: item.id,
			user: interaction.user.id,
			guild: interaction.guildId ?? 'none',
			channel: interaction.channelId,
			reason: 'sell',
		});

		this.container.metrics.incrementMoneyEarned({
			command: interaction.commandName,
			user: interaction.user.id,
			guild: interaction.guildId ?? 'none',
			channel: interaction.channelId,
			reason: 'store',
			value: item.sellPrice * amount,
		});

		return interaction.editReply(
			`You have sold ${amount} ${item.name} for ${formatMoney(item.sellPrice * amount)}.`,
		);
	}
}
