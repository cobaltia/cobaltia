import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { jaroWinkler } from '@skyra/jaro-winkler';
import { type ApplicationCommandOptionChoiceData, type AutocompleteInteraction } from 'discord.js';
import { type Item } from '#lib/structures/Item';
import { getInventory } from '#lib/util/functions/inventoryHelper';

export class ItemAutocomplete extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Autocomplete,
		});
	}

	public override async run(
		interaction: AutocompleteInteraction<'cached'>,
		result: InteractionHandler.ParseResult<this>,
	) {
		return interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction<'cached'>) {
		const validCommands = ['item', 'store'];
		if (!validCommands.includes(interaction.commandName)) return this.none();

		const focusedOption = interaction.options.getFocused(true);
		const subcommand = interaction.options.getSubcommand(true);

		if (focusedOption.name === 'item') {
			let allItems = Array.from(this.container.stores.get('items').values());

			if (isNullishOrEmpty(allItems)) {
				return this.some([]);
			}

			const validSubcommands = ['sell', 'use'];
			if (validSubcommands.includes(subcommand)) {
				const result = await getInventory(interaction.member.id);
				if (result.isSome()) {
					const inventory = result.unwrap();

					allItems = allItems.filter(item => inventory.has(item.name));
				} else {
					allItems = [];
				}

				if (subcommand === 'use') {
					allItems = allItems.filter(item => !item.collectible);
				}
			}

			if (isNullishOrEmpty(focusedOption.value)) {
				return this.some(
					Array.from(allItems)
						.slice(0, 20)
						.map<ApplicationCommandOptionChoiceData>(result => ({
							name: `${result.displayName}`,
							value: result.name,
						})),
				);
			}

			return this.some(this.fuzzySearch(focusedOption.value, allItems));
		}

		return this.none();
	}

	private fuzzySearch(query: string, values: Item[]) {
		const results = [];
		const threshold = 0.5;
		const lowerCaseQuery = query.toLowerCase();

		let similarity: number;
		let almostExacts = 0;

		for (const value of values) {
			const lowerCaseName = value.displayName.toLowerCase();

			if (lowerCaseName === lowerCaseQuery) {
				similarity = 1;
			} else {
				similarity = jaroWinkler(lowerCaseQuery, lowerCaseName);
			}

			if (similarity < threshold) continue;

			results.push({ ...value, similarity });
			if (similarity > 0.9) almostExacts++;
			if (almostExacts === 10) break;
		}

		if (!results.length) return [];

		return results
			.toSorted((a, b) => b.similarity - a.similarity)
			.slice(0, 20)
			.map<ApplicationCommandOptionChoiceData>(result => ({ name: `${result.displayName}`, value: result.name }));
	}
}
