import { PatternCommand } from '@sapphire/plugin-pattern-commands';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	type MessageActionRowComponentBuilder,
	type Message,
} from 'discord.js';
import { isGuildMessage } from '#lib/util/discord-utilities';

export class ChristmasPatternCommand extends PatternCommand {
	public constructor(context: PatternCommand.LoaderContext, options: PatternCommand.Options) {
		super(context, {
			...options,
			aliases: ['christmas'],
			// TODO: Verify that this is dynamic and not staticlly setting the value at startup
			chance: new Date().getUTCMonth() === 11 && new Date().getUTCDate() === 25 ? 50 : 10,
			description: 'A chance to get some presents!',
		});
	}

	public async messageRun(message: Message) {
		if (!isGuildMessage(message)) return;

		const eventActive = await this.container.prisma.event.findFirst({
			where: { name: 'christmas2025', enabled: true },
		});
		if (!eventActive) return;

		const itemStore = this.container.stores.get('items');
		const christmasGift = itemStore.get('christmasGift2025');

		const embed = new EmbedBuilder()
			.setTitle('Santa Claus has dropped something off!')
			.setDescription('Ho Ho Ho! Merry Christmas! You have a chance to win some presents today.');

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setEmoji(
						typeof christmasGift?.iconEmoji === 'object'
							? { id: christmasGift?.iconEmoji.id }
							: { name: '' },
					)
					.setLabel('Claim Presents')
					.setCustomId(`button:christmas:claim`)
					.setDisabled(false),
			),
		];

		await message.channel.send({ embeds: [embed], components });
	}
}
