import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { jaroWinkler } from '@skyra/jaro-winkler';
import { type ApplicationCommandOptionChoiceData, type AutocompleteInteraction } from 'discord.js';
import { type Event } from '#lib/structures/Event';

export class EventAutocomplete extends InteractionHandler {
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
		const validCommands = ['event'];
		if (!validCommands.includes(interaction.commandName)) return this.none();

		const focusedOption = interaction.options.getFocused(true);

		if (focusedOption.name === 'event') {
			const storeEvents = Array.from(this.container.stores.get('events').values());
			const enabledEventRows = await this.container.prisma.event.findMany({
				where: { enabled: true },
				select: { name: true },
			});
			const enabledNames = new Set(enabledEventRows.map(evt => evt.name));
			const allEvents = storeEvents.filter(evnt => enabledNames.has(evnt.name));

			if (isNullishOrEmpty(allEvents)) {
				return this.some([]);
			}

			if (isNullishOrEmpty(focusedOption.value)) {
				return this.some(
					Array.from(allEvents)
						.slice(0, 20)
						.map<ApplicationCommandOptionChoiceData>(result => ({
							name: `${result.name}`,
							value: result.name,
						})),
				);
			}

			return this.some(this.fuzzySearch(focusedOption.value, allEvents));
		}

		return this.none();
	}

	private fuzzySearch(query: string, values: Event[]) {
		const results = [];
		const threshold = 0.5;
		const lowerCaseQuery = query.toLowerCase();

		let similarity: number;
		let almostExacts = 0;

		for (const value of values) {
			const lowerCaseName = value.name.toLowerCase();

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
			.map<ApplicationCommandOptionChoiceData>(result => ({ name: `${result.name}`, value: result.name }));
	}
}
