import { type CpuInfo, cpus, uptime } from 'node:os';
import process from 'node:process';
import { version as sapphireVersion, Command } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { roundNumber } from '@sapphire/utilities';
import { EmbedBuilder, TimestampStyles, hideLinkEmbed, hyperlink, time, version } from 'discord.js';
import { Colors } from '#lib/util/constants';

export class InfoCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Get information about the bot.',
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => builder.setName(this.name).setDescription(this.description));
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return interaction.reply({
			embeds: [this.embed],
			ephemeral: true,
		});
	}

	private get embed() {
		const stats = this.generalStats;
		const uptime = this.uptimeStats;
		const usage = this.usageStats;

		const fields = {
			stats: [
				//
				`• **Node.js**: ${stats.nodeJs}`,
				`• **Discord.js**: ${stats.version}`,
				`• **Sapphire Framework**: ${stats.sapphireVersion}`,
			].join('\n'),
			uptime: [
				//
				`• **Host**: ${uptime.host}`,
				`• **Total**: ${uptime.total}`,
				`• **Client**: ${uptime.client}`,
			].join('\n'),
			usage: [
				//
				`• **CPU Load**: ${usage.cpuLoad}`,
				`• **Heap**: ${usage.ramUsed}MB (Total: ${usage.ramTotal}MB)`,
			].join('\n'),
		};

		return new EmbedBuilder()
			.setDescription(
				`Cobaltia is a Discord bot using the ${hyperlink(
					'Sapphire framework',
					hideLinkEmbed('https://sapphirejs.dev'),
				)} built on top of ${hyperlink('discord.js', hideLinkEmbed('https://discord.js.org'))}`,
			)
			.setFields(
				{ name: 'Statistics', value: fields.stats },
				{ name: 'Uptime', value: fields.uptime },
				{ name: 'Usage', value: fields.usage },
			)
			.setColor(Colors.Blue);
	}

	private get generalStats() {
		return {
			nodeJs: process.version,
			version: `v${version}`,
			sapphireVersion: `v${sapphireVersion}`,
		};
	}

	private get uptimeStats() {
		const now = Date.now();
		const nowSeconds = roundNumber(now / 1_000);
		return {
			client: time(
				roundNumber((now - this.container.client.uptime!) / Time.Second),
				TimestampStyles.RelativeTime,
			),
			host: time(roundNumber(nowSeconds - uptime()), TimestampStyles.RelativeTime),
			total: time(roundNumber(nowSeconds - process.uptime()), TimestampStyles.RelativeTime),
		};
	}

	private get usageStats() {
		const usage = process.memoryUsage();
		return {
			cpuLoad: cpus().map(InfoCommand.formatCpuInfo.bind(null)).join(' | '),
			ramTotal: (usage.heapTotal / 1_048_576).toLocaleString(),
			ramUsed: (usage.heapUsed / 1_048_576).toLocaleString(),
		};
	}

	private static formatCpuInfo({ times }: CpuInfo) {
		return `${roundNumber(((times.user + times.nice + times.sys + times.irq) / times.idle) * 10_000) / 100}%`;
	}
}
