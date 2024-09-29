import process from 'node:process';
import { PrismaClient } from '@prisma/client';
import { REST, Routes } from 'discord.js';

const prisma = new PrismaClient();
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

export async function main() {
	const guilds = await rest.get(Routes.userGuilds());

	for (const guild of guilds) {
		console.log(guild);
		await updateGuildUser(guild);
	}
}

async function updateGuildUser(guild) {
	// eslint-disable-next-line n/prefer-global/url-search-params
	const query = new URLSearchParams('limit=1000');
	const members = await rest.get(Routes.guildMembers(guild.id), { query });
	for (const member of members) {
		if (member.user.bot) continue;
		console.log(member.user);

		const prismaUser = await prisma.user.findUnique({
			where: {
				id: member.user.id,
			},
		});

		if (prismaUser && !prismaUser.guilds.includes(guild.id)) {
			console.log(`Adding user ${member.user.id} to guild ${guild.id}`);

			await prisma.user.update({
				where: {
					id: member.user.id,
				},
				data: {
					guilds: { set: [...prismaUser.guilds, guild.id] },
				},
			});
		}
	}
}

await main();
