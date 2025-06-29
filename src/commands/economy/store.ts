import { type ApplicationCommandRegistry } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { EmbedBuilder, bold, inlineCode } from 'discord.js';
import { getUser } from '#lib/database';
import { handleBuy } from '#lib/util/economy';
import { formatMoney } from '#util/common';

export class StoreCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			description: 'A store where you can view or buy items.',
			subcommands: [
				{ name: 'view', chatInputRun: 'chatInputView' },
				{ name: 'buy', chatInputRun: 'chatInputBuy' },
			],
		});
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand(command => command.setName('view').setDescription('View an item shop.'))
				.addSubcommand(command =>
					command
						.setName('buy')
						.setDescription('Buy an item')
						.addStringOption(option =>
							option
								.setName('item')
								.setDescription('The item to buy')
								.setRequired(true)
								.setAutocomplete(true),
						)
						.addIntegerOption(option =>
							option.setName('amount').setDescription('The amount of items to buy'),
						),
				),
		);
	}

	public async chatInputView(interaction: Subcommand.ChatInputCommandInteraction) {
		const items = this.container.stores.get('items');

		const embed = new EmbedBuilder()
			.setTitle('Item Shop')
			.setDescription(
				items
					.map(
						item =>
							`${item.icon} ${bold(item.name)} - ${inlineCode(formatMoney(item.price)!)}\n${item.description}\n`,
					)
					.join('\n'),
			);

		return interaction.reply({ embeds: [embed] });
	}

	public async chatInputBuy(interaction: Subcommand.ChatInputCommandInteraction) {
		const item = interaction.options.getString('item', true);
		const amount = interaction.options.getInteger('amount', false) ?? undefined;
		const items = this.container.stores.get('items');

		const storeItem = items.get(item);
		if (!storeItem) return interaction.reply('That item does not exist.');

		const result = await getUser(interaction.user.id);
		const data = result.unwrap();

		if (result.isErr()) throw result.unwrapErr();

		if (data.wallet < storeItem.price) return interaction.reply('You do not have enough money to buy this item.');

		const buyResult = await handleBuy(storeItem, interaction.user.id, amount);
		if (buyResult.isErr()) return interaction.reply((buyResult.unwrapErr() as Error).message);

		return interaction.reply(
			(amount ?? 1) >= 2
				? `You have bought ${amount} ${storeItem.name}s.`
				: `You have bought a ${storeItem.name}.`,
		);
	}
}
