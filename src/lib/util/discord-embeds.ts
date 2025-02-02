import type { Inventory, User as PrismaUser } from '@prisma/client';
import { container } from '@sapphire/framework';
import { DurationFormatter } from '@sapphire/time-utilities';
import { EmbedBuilder, inlineCode, time, TimestampStyles, type User } from 'discord.js';
import { compactNumber, formatMoney, formatNumber } from '#util/common';
import { getTag } from '#util/discord-utilities';
import { getInventoryNetWorth } from '#util/economy';
import { nextLevel } from '#util/experience';

export async function profileEmbed(data: PrismaUser, inventory: Inventory, user: User) {
	return new EmbedBuilder()
		.setTitle(`${getTag(user)}'s Profile`)
		.setFields(
			{ name: 'Level', value: getLevel(data), inline: true },
			{ name: 'Money', value: getMoney(data, inventory), inline: true },
			{ name: 'Other', value: getOther(data), inline: true },
			{ name: 'Voice Chat', value: await getVoice(data), inline: true },
		);
}

function getLevel(data: PrismaUser) {
	const next = nextLevel(data.level);
	const content = [
		`Level: ${inlineCode(formatNumber(data.level)!)}`,
		`Experience: ${inlineCode(`${compactNumber(data.experience)!}/${compactNumber(next.unwrap()!)}`)}`,
	];
	return content.join('\n');
}

function getMoney(data: PrismaUser, inventory: Inventory) {
	const content = [
		`Wallet: ${inlineCode(formatMoney(data.wallet, true)!)}`,
		`Bank: ${inlineCode(formatMoney(data.bankBalance, true)!)}`,
		`Inventory: ${inlineCode(formatMoney(getInventoryNetWorth(inventory), true)!)}`,
		`Net: ${inlineCode(formatMoney(data.wallet + data.bankBalance + getInventoryNetWorth(inventory), true)!)}`,
		`Bounty: ${inlineCode(formatMoney(data.bounty, true)!)}`,
	];
	return content.join('\n');
}

function getOther(data: PrismaUser) {
	const content = [`Social Credit: ${inlineCode(`${data.socialCredit.toString()}/2000`)}`];
	return content.join('\n');
}

async function getVoice(data: PrismaUser) {
	const formatter = new DurationFormatter();
	const voiceData = await container.prisma.voice.findMany({
		where: { userId: data.id },
		orderBy: { date: 'desc' },
	});
	if (voiceData.length === 0) return 'No voice data found';
	const content = [
		`Last Joined: ${time(voiceData[0].date, TimestampStyles.RelativeTime)}`,
		`Last Duration: ${inlineCode(formatter.format(voiceData[0].duration))}`,
		`Total Time: ${inlineCode(formatter.format(voiceData.reduce((acc, curr) => acc + curr.duration, 0)))}`,
	];
	return content.join('\n');
}
